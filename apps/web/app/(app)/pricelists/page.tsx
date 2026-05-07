"use client";

import Link from "next/link";
import useSWR from "swr";

import { fetcher, type PricelistVersion } from "@/lib/api-client";

export default function PricelistsPage() {
  const { data } = useSWR<PricelistVersion[]>("/api/v1/pricelists", fetcher, {
    refreshInterval: 5000,
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">단가표 버전</h1>
        <Link
          href="/pricelists/upload"
          className="rounded bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
        >
          + 업로드
        </Link>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">파일</th>
              <th className="px-4 py-2">유형</th>
              <th className="px-4 py-2">상태</th>
              <th className="px-4 py-2">유효월</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((v) => (
              <tr key={v.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{v.id}</td>
                <td className="px-4 py-2">{v.source_filename}</td>
                <td className="px-4 py-2 uppercase">{v.source_kind}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={v.status} />
                </td>
                <td className="px-4 py-2">{v.effective_month || "—"}</td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/pricelists/${v.id}/verify`}
                    className="text-xs text-brand hover:underline"
                  >
                    검증
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color: Record<string, string> = {
    uploaded: "bg-slate-200",
    extracting: "bg-amber-200",
    review: "bg-sky-200",
    verified: "bg-emerald-200",
    failed: "bg-red-200",
    archived: "bg-slate-300",
  };
  return (
    <span className={`rounded px-2 py-0.5 text-xs ${color[status] || "bg-slate-100"}`}>
      {status}
    </span>
  );
}
