"use client";

import Link from "next/link";
import useSWR from "swr";

import { fetcher, type PricelistVersion } from "@/lib/api-client";

export default function DashboardPage() {
  const { data, error } = useSWR<PricelistVersion[]>("/api/v1/pricelists", fetcher);

  if (error) return <p className="text-sm text-red-600">로그인이 필요합니다. <Link className="underline" href="/login">로그인</Link></p>;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">대시보드</h1>
      <p className="mb-6 text-sm text-slate-500">
        본사 단가표 업로드 → 검증 → 사용자 Excel 비교 → 머지 다운로드.
      </p>

      <section className="mb-8 grid grid-cols-2 gap-4">
        <Link
          href="/pricelists/upload"
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:shadow"
        >
          <h2 className="mb-1 text-lg font-semibold">본사 단가표 업로드</h2>
          <p className="text-sm text-slate-500">PDF/XLSX → 자동 추출 → 검증</p>
        </Link>
        <Link
          href="/compare/new"
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:shadow"
        >
          <h2 className="mb-1 text-lg font-semibold">비교 시작</h2>
          <p className="text-sm text-slate-500">내 Excel을 검증된 단가표와 비교</p>
        </Link>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">최근 단가표 버전</h2>
        <div className="rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2">파일</th>
                <th className="px-4 py-2">유형</th>
                <th className="px-4 py-2">상태</th>
                <th className="px-4 py-2">업로드</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(data || []).map((v) => (
                <tr key={v.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{v.source_filename}</td>
                  <td className="px-4 py-2 uppercase">{v.source_kind}</td>
                  <td className="px-4 py-2">{v.status}</td>
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {new Date(v.created_at).toLocaleString("ko-KR")}
                  </td>
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
              {(!data || data.length === 0) && (
                <tr>
                  <td className="px-4 py-6 text-center text-xs text-slate-400" colSpan={5}>
                    아직 업로드된 단가표가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
