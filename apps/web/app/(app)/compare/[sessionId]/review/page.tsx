"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";

import { api, fetcher, type DiffItem, type DiffType, type SessionSummary } from "@/lib/api-client";

const TYPE_LABEL: Record<DiffType, string> = {
  added: "신규 추가",
  removed: "단종",
  price_changed: "가격 변경",
  model_name_changed: "모델명 변경",
  sku_changed_suspected: "코드 변경 의심",
  category_changed: "카테고리 변경",
  unchanged: "변동 없음",
};

const TYPE_COLOR: Record<DiffType, string> = {
  added: "bg-emerald-100 text-emerald-800",
  removed: "bg-red-100 text-red-800",
  price_changed: "bg-amber-100 text-amber-800",
  model_name_changed: "bg-sky-100 text-sky-800",
  sku_changed_suspected: "bg-purple-100 text-purple-800",
  category_changed: "bg-slate-200 text-slate-700",
  unchanged: "bg-slate-100 text-slate-500",
};

export default function ReviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [filter, setFilter] = useState<DiffType | "">("");
  const { data: session } = useSWR<SessionSummary>(
    () => (sessionId ? `/api/v1/compare/${sessionId}` : null),
    fetcher,
    { refreshInterval: (s) => (s?.status === "ready" || s?.status === "failed" ? 0 : 2000) }
  );
  const { data: diffs, mutate } = useSWR<DiffItem[]>(
    () =>
      sessionId && session?.status === "ready"
        ? `/api/v1/compare/${sessionId}/diffs${filter ? `?diff_type=${filter}` : ""}`
        : null,
    fetcher
  );

  async function toggle(id: number, selected: boolean) {
    await api.patch(`/api/v1/compare/${sessionId}/diffs`, {
      diff_ids: [id],
      selected,
    });
    await mutate();
  }

  async function bulkSelect(selected: boolean) {
    if (!diffs) return;
    await api.patch(`/api/v1/compare/${sessionId}/diffs`, {
      diff_ids: diffs.map((d) => d.id),
      selected,
    });
    await mutate();
  }

  async function startMerge() {
    // 비교 시 사용한 시트/매핑을 다시 입력받아야 한다. MVP에선 첫 시트와 추정 매핑 재사용.
    const sheetName = prompt("시트명 (사용자 Excel)", "단가표") || "단가표";
    const skuCol = prompt("SKU 컬럼 (예: A)", "A") || "A";
    const modelCol = prompt("모델명 컬럼 (없으면 빈값)", "B") || "";
    const listCol = prompt("정가 컬럼 (없으면 빈값)", "D") || "";
    const dealerCol = prompt("딜러가 컬럼 (없으면 빈값)", "E") || "";
    const catCol = prompt("카테고리 컬럼 (없으면 빈값)", "") || "";
    const job = await api.post<{ id: number }>(`/api/v1/compare/${sessionId}/merge`, {
      sheet_name: sheetName,
      mapping: {
        sku: skuCol,
        model_name: modelCol || null,
        list_price: listCol || null,
        dealer_price: dealerCol || null,
        category: catCol || null,
      },
      add_new_rows: true,
      mark_removed: true,
    });
    router.push(`/merges/${job.id}`);
  }

  if (!session) return <p className="text-sm text-slate-500">불러오는 중...</p>;
  if (session.status !== "ready") {
    return (
      <p className="text-sm text-slate-500">
        비교 진행 중... (현재 상태: {session.status}). 자동 새로고침됩니다.
      </p>
    );
  }

  const summary = session.summary || {};

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">변경 리뷰 #{sessionId}</h1>

      <section className="mb-4 grid grid-cols-6 gap-2">
        {(Object.keys(TYPE_LABEL) as DiffType[]).map((t) => {
          const count = summary[t] || 0;
          if (t === "unchanged") return null;
          return (
            <button
              key={t}
              onClick={() => setFilter(filter === t ? "" : t)}
              className={`rounded border p-3 text-left ${
                filter === t ? "border-brand bg-brand/5" : "border-slate-200 bg-white"
              }`}
            >
              <div className="text-xs text-slate-500">{TYPE_LABEL[t]}</div>
              <div className="text-2xl font-bold">{count}</div>
            </button>
          );
        })}
      </section>

      <div className="mb-3 flex gap-2">
        <button
          onClick={() => bulkSelect(true)}
          className="rounded border border-slate-300 bg-white px-3 py-1 text-xs hover:bg-slate-50"
        >
          현재 보기 모두 선택
        </button>
        <button
          onClick={() => bulkSelect(false)}
          className="rounded border border-slate-300 bg-white px-3 py-1 text-xs hover:bg-slate-50"
        >
          현재 보기 모두 해제
        </button>
        <button
          onClick={() => setFilter("")}
          className="rounded border border-slate-300 bg-white px-3 py-1 text-xs hover:bg-slate-50"
        >
          전체 보기
        </button>
        <div className="flex-1" />
        <button
          onClick={startMerge}
          className="rounded bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
        >
          내 Excel에 적용 (머지)
        </button>
      </div>

      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-2 py-1">선택</th>
              <th className="px-2 py-1">유형</th>
              <th className="px-2 py-1">SKU</th>
              <th className="px-2 py-1">모델명 (변경 전 → 변경 후)</th>
              <th className="px-2 py-1">정가</th>
              <th className="px-2 py-1">딜러가</th>
              <th className="px-2 py-1">카테고리</th>
              <th className="px-2 py-1">행</th>
            </tr>
          </thead>
          <tbody>
            {(diffs || []).map((d) => (
              <tr key={d.id} className="border-t border-slate-100">
                <td className="px-2 py-1">
                  <input
                    type="checkbox"
                    checked={d.selected}
                    onChange={(e) => toggle(d.id, e.target.checked)}
                  />
                </td>
                <td className="px-2 py-1">
                  <span className={`rounded px-2 py-0.5 ${TYPE_COLOR[d.diff_type]}`}>
                    {TYPE_LABEL[d.diff_type]}
                  </span>
                </td>
                <td className="px-2 py-1 font-mono">{d.sku}</td>
                <td className="px-2 py-1">
                  <Pair before={d.before?.model_name as string} after={d.after?.model_name as string} />
                </td>
                <td className="px-2 py-1">
                  <Pair before={d.before?.list_price as string} after={d.after?.list_price as string} />
                </td>
                <td className="px-2 py-1">
                  <Pair before={d.before?.dealer_price as string} after={d.after?.dealer_price as string} />
                </td>
                <td className="px-2 py-1">
                  <Pair before={d.before?.category as string} after={d.after?.category as string} />
                </td>
                <td className="px-2 py-1 text-slate-400">{d.source_ref?.row ?? "—"}</td>
              </tr>
            ))}
            {(!diffs || diffs.length === 0) && (
              <tr>
                <td className="px-2 py-4 text-center text-slate-400" colSpan={8}>
                  표시할 변경 항목이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Pair({ before, after }: { before?: string; after?: string }) {
  if (before === after) return <span className="text-slate-400">{before ?? "—"}</span>;
  return (
    <span>
      <span className="text-slate-400 line-through">{before ?? "—"}</span>
      <span className="mx-1 text-slate-300">→</span>
      <span className="font-semibold">{after ?? "—"}</span>
    </span>
  );
}
