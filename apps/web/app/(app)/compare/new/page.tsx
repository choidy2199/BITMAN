"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";

import { api, fetcher, type PricelistVersion } from "@/lib/api-client";

interface SheetInfo {
  name: string;
  headers: { col: string; value: string }[];
  data_rows: number;
}

interface PreviewResponse {
  sheets: SheetInfo[];
  suggested_mapping: {
    sku: string;
    model_name?: string;
    list_price?: string;
    dealer_price?: string;
    category?: string;
  } | null;
}

export default function CompareNewPage() {
  const router = useRouter();
  const { data: versions } = useSWR<PricelistVersion[]>("/api/v1/pricelists", fetcher);
  const [sheetId, setSheetId] = useState<number | null>(null);
  const [versionId, setVersionId] = useState<number | null>(null);
  const [sheetName, setSheetName] = useState("");
  const [headerRow, setHeaderRow] = useState(1);
  const [mapping, setMapping] = useState({
    sku: "A",
    model_name: "",
    list_price: "",
    dealer_price: "",
    category: "",
  });

  const { data: preview } = useSWR<PreviewResponse>(
    () => (sheetId ? `/api/v1/user-sheets/${sheetId}/preview` : null),
    fetcher
  );

  useEffect(() => {
    if (preview) {
      if (preview.sheets[0]) setSheetName(preview.sheets[0].name);
      if (preview.suggested_mapping) {
        setMapping({
          sku: preview.suggested_mapping.sku || "A",
          model_name: preview.suggested_mapping.model_name || "",
          list_price: preview.suggested_mapping.list_price || "",
          dealer_price: preview.suggested_mapping.dealer_price || "",
          category: preview.suggested_mapping.category || "",
        });
      }
    }
  }, [preview]);

  async function uploadSheet(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/v1/user-sheets/upload", {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    const json = await res.json();
    setSheetId(json.id);
  }

  async function startCompare() {
    if (!sheetId || !versionId) return;
    const json = await api.post<{ id: number }>("/api/v1/compare", {
      user_sheet_id: sheetId,
      version_id: versionId,
      sheet_name: sheetName,
      header_row: headerRow,
      mapping: {
        sku: mapping.sku,
        model_name: mapping.model_name || null,
        list_price: mapping.list_price || null,
        dealer_price: mapping.dealer_price || null,
        category: mapping.category || null,
      },
    });
    router.push(`/compare/${json.id}/review`);
  }

  const verified = (versions || []).filter((v) => v.status === "verified");

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold">비교 시작</h1>
      <p className="mb-6 text-sm text-slate-500">
        사용자 Excel을 업로드하고 컬럼 매핑을 확정한 뒤, 검증된 본사 단가표 버전을 선택해 비교하세요.
      </p>

      <section className="mb-6 rounded border bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">1. 사용자 Excel 업로드</h2>
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => e.target.files?.[0] && uploadSheet(e.target.files[0])}
        />
        {sheetId && (
          <p className="mt-2 text-xs text-emerald-700">
            업로드 완료 (sheet id: {sheetId})
          </p>
        )}
      </section>

      {preview && (
        <section className="mb-6 rounded border bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold">2. 컬럼 매핑</h2>
          <label className="mb-2 block text-xs">
            <span className="font-semibold text-slate-600">시트</span>
            <select
              className="ml-2 rounded border border-slate-300 px-2 py-1"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
            >
              {preview.sheets.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name} ({s.data_rows} rows)
                </option>
              ))}
            </select>
            <span className="ml-3 font-semibold text-slate-600">헤더 행</span>
            <input
              type="number"
              min={1}
              value={headerRow}
              onChange={(e) => setHeaderRow(Number(e.target.value))}
              className="ml-2 w-16 rounded border border-slate-300 px-2 py-1"
            />
          </label>
          <div className="grid grid-cols-5 gap-3">
            {(["sku", "model_name", "list_price", "dealer_price", "category"] as const).map(
              (f) => (
                <label key={f} className="block text-xs">
                  <span className="mb-1 block font-semibold text-slate-600">{f}</span>
                  <input
                    className="w-full rounded border border-slate-300 px-2 py-1"
                    value={mapping[f]}
                    onChange={(e) =>
                      setMapping((m) => ({ ...m, [f]: e.target.value.toUpperCase() }))
                    }
                    placeholder={f === "sku" ? "A" : ""}
                  />
                </label>
              )
            )}
          </div>
        </section>
      )}

      <section className="mb-6 rounded border bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">3. 본사 단가표 버전 선택</h2>
        <select
          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
          value={versionId ?? ""}
          onChange={(e) => setVersionId(Number(e.target.value))}
        >
          <option value="">— 검증된 버전 선택 —</option>
          {verified.map((v) => (
            <option key={v.id} value={v.id}>
              #{v.id} {v.source_filename} {v.effective_month ? `(${v.effective_month})` : ""}
            </option>
          ))}
        </select>
      </section>

      <button
        onClick={startCompare}
        disabled={!sheetId || !versionId}
        className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        비교 시작
      </button>
    </div>
  );
}
