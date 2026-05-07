"use client";

import useSWR from "swr";

import { fetcher } from "@/lib/api-client";

interface HistoryItem {
  id: number;
  actor_id: number | null;
  action: string;
  target_type: string;
  target_id: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  created_at: string;
}

export default function HistoryPage() {
  const { data } = useSWR<HistoryItem[]>("/api/v1/history?limit=200", fetcher);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">변경 이력</h1>
      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-2 py-1">시각</th>
              <th className="px-2 py-1">사용자</th>
              <th className="px-2 py-1">액션</th>
              <th className="px-2 py-1">대상</th>
              <th className="px-2 py-1">상세</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((h) => (
              <tr key={h.id} className="border-t border-slate-100">
                <td className="px-2 py-1 text-slate-500">
                  {new Date(h.created_at).toLocaleString("ko-KR")}
                </td>
                <td className="px-2 py-1">{h.actor_id ?? "—"}</td>
                <td className="px-2 py-1 font-mono">{h.action}</td>
                <td className="px-2 py-1">
                  {h.target_type} #{h.target_id}
                </td>
                <td className="px-2 py-1 max-w-md truncate text-slate-500">
                  {h.after ? JSON.stringify(h.after) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
