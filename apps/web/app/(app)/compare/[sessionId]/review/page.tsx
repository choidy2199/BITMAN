"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
  const [addNewRows, setAddNewRows] = useState(true);
  const [markRemoved, setMarkRemoved] = useState(true);
  const [merging, setMerging] = useState(false);
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

  const selectedCount = useMemo(
    () => (diffs || []).filter((d) => d.selected).length,
    [diffs]
  );

  async function startMerge() {
    setMerging(true);
    try {
      const job = await api.post<{ id: number }>(`/api/v1/compare/${sessionId}/merge`, {
        add_new_rows: addNewRows,
        mark_removed: markRemoved,
      });
      router.push(`/merges/${job.id}`);
    } finally {
      setMerging(false);
    }
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

      <div className="mb-3 flex flex-wrap items-center gap-2">
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
        <label className="flex items-center gap-1 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={addNewRows}
            onChange={(e) => setAddNewRows(e.target.checked)}
          />
          신규 행 추가
        </label>
        <label className="flex items-center gap-1 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={markRemoved}
            onChange={(e) => setMarkRemoved(e.target.checked)}
          />
          단종은 _단종후보 시트에 기록
        </label>
        <button
          onClick={startMerge}
          disabled={merging || selectedCount === 0}
          className="rounded bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {merging ? "머지 중..." : `내 Excel에 적용 (${selectedCount}건)`}
        </button>
      </div>
      {session.sheet_name && (
        <p className="mb-3 text-xs text-slate-500">
          시트: <span className="font-mono">{session.sheet_name}</span> · SKU 컬럼{" "}
          <span className="font-mono">{(session.mapping as { sku?: string } | null)?.sku ?? "?"}</span>
        </p>
      )}

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
