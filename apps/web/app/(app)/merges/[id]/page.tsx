"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";

import { fetcher } from "@/lib/api-client";

interface MergeJob {
  id: number;
  status: string;
  output_path: string | null;
  warnings: string[] | null;
  error: string | null;
}

export default function MergeJobPage() {
  const { id } = useParams<{ id: string }>();
  const { data } = useSWR<MergeJob>(
    () => (id ? `/api/v1/merges/${id}` : null),
    fetcher,
    { refreshInterval: (j) => (j?.status === "done" || j?.status === "failed" ? 0 : 1500) }
  );

  if (!data) return <p className="text-sm text-slate-500">불러오는 중...</p>;

  return (
    <div className="max-w-xl">
      <h1 className="mb-2 text-2xl font-bold">머지 결과 #{data.id}</h1>
      <p className="mb-4 text-sm">
        상태: <strong>{data.status}</strong>
      </p>

      {data.status === "running" && (
        <p className="text-sm text-slate-500">머지 작업 진행 중...</p>
      )}

      {data.status === "failed" && (
        <p className="text-sm text-red-600">실패: {data.error}</p>
      )}

      {data.status === "done" && (
        <div className="rounded border bg-white p-4">
          <a
            href={`/api/v1/merges/${data.id}/download`}
            className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            머지된 Excel 다운로드
          </a>
          {data.warnings && data.warnings.length > 0 && (
            <div className="mt-4">
              <h2 className="mb-1 text-xs font-semibold text-amber-700">경고</h2>
              <ul className="list-inside list-disc text-xs text-amber-700">
                {data.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
