"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PricelistUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [month, setMonth] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    if (month) fd.append("effective_month", month);
    const res = await fetch("/api/v1/pricelists/upload", {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    setLoading(false);
    if (!res.ok) {
      setError("업로드 실패");
      return;
    }
    const json = await res.json();
    router.push(`/pricelists/${json.id}/verify`);
  }

  return (
    <div className="max-w-xl">
      <h1 className="mb-2 text-2xl font-bold">본사 단가표 업로드</h1>
      <p className="mb-6 text-sm text-slate-500">
        PDF는 텍스트 PDF만 지원(스캔본은 추후). XLSX도 가능.
      </p>
      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">파일</span>
          <input
            type="file"
            accept=".pdf,.xlsx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
            className="w-full text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">유효 월(선택)</span>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={!file || loading}
          className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? "업로드 중..." : "업로드 후 추출 시작"}
        </button>
      </form>
    </div>
  );
}
