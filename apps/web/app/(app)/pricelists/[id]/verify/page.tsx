"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { api, fetcher } from "@/lib/api-client";

interface ExtractionRow {
  row_id: string;
  page?: number;
  cells: Record<string, string | null>;
  confidence: number;
  needs_review: boolean;
}

interface ExtractionResponse {
  version_id: number;
  rows: ExtractionRow[];
  column_mapping: Record<string, string> | null;
  confidence: number;
  page_count: number;
  edited: boolean;
}

const FIELDS = [
  { key: "sku", label: "SKU (필수)" },
  { key: "model_name", label: "모델명" },
  { key: "list_price", label: "정가" },
  { key: "dealer_price", label: "딜러가" },
  { key: "category", label: "카테고리" },
];

export default function VerifyPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { data, mutate } = useSWR<ExtractionResponse>(
    () => (id ? `/api/v1/pricelists/${id}/extraction` : null),
    fetcher,
    { refreshInterval: (d) => (d ? 0 : 3000) }
  );

  const [rows, setRows] = useState<ExtractionRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (data) {
      setRows(data.rows);
      setMapping(data.column_mapping || {});
    }
  }, [data]);

  const columnIndices = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => Object.keys(r.cells).forEach((k) => set.add(k)));
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [rows]);

  function updateCell(rowIdx: number, col: string, value: string) {
    setRows((prev) => {
      const next = [...prev];
      next[rowIdx] = {
        ...next[rowIdx],
        cells: { ...next[rowIdx].cells, [col]: value },
      };
      return next;
    });
  }

  async function save() {
    await api.patch(`/api/v1/pricelists/${id}/extraction`, {
      rows,
      column_mapping: mapping,
    });
    await mutate();
  }

  async function verify() {
    if (!mapping.sku) {
      alert("SKU 컬럼 매핑이 필요합니다.");
      return;
    }
    setVerifying(true);
    try {
      await save();
      await api.post(`/api/v1/pricelists/${id}/verify`);
      router.push("/pricelists");
    } finally {
      setVerifying(false);
    }
  }

  if (!data) return <p className="text-sm text-slate-500">추출 중... (자동 새로고침)</p>;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">단가표 검증 #{id}</h1>
      <p className="mb-4 text-sm text-slate-500">
        페이지 {data.page_count} / 평균 신뢰도 {(data.confidence * 100).toFixed(0)}% / 행 {rows.length}
      </p>

      <section className="mb-6 rounded border bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">컬럼 매핑</h2>
        <div className="grid grid-cols-5 gap-3">
          {FIELDS.map((f) => (
            <label key={f.key} className="block text-xs">
              <span className="mb-1 block font-semibold text-slate-600">{f.label}</span>
              <select
                className="w-full rounded border border-slate-300 px-2 py-1"
                value={mapping[f.key] ?? ""}
                onChange={(e) =>
                  setMapping((m) => ({ ...m, [f.key]: e.target.value }))
                }
              >
                <option value="">—</option>
                {columnIndices.map((c) => (
                  <option key={c} value={c}>
                    Col {c}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </section>

      <div className="mb-4 flex gap-2">
        <button
          onClick={save}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs hover:bg-slate-50"
        >
          저장
        </button>
        <button
          onClick={verify}
          disabled={verifying}
          className="rounded bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {verifying ? "확정 중..." : "검증 완료(확정)"}
        </button>
      </div>

      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-2 py-1 text-left">#</th>
              <th className="px-2 py-1 text-left">신뢰도</th>
              {columnIndices.map((c) => (
                <th key={c} className="px-2 py-1 text-left">
                  Col {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.row_id} className={r.needs_review ? "bg-amber-50" : ""}>
                <td className="px-2 py-1 text-slate-400">{i + 1}</td>
                <td className="px-2 py-1 text-slate-500">
                  {(r.confidence * 100).toFixed(0)}%
                </td>
                {columnIndices.map((c) => (
                  <td key={c} className="px-1 py-0.5">
                    <input
                      className="w-full rounded border border-slate-200 px-1 py-0.5"
                      value={r.cells[c] ?? ""}
                      onChange={(e) => updateCell(i, c, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
