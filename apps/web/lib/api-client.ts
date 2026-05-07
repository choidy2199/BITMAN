// 브라우저에서는 Next.js의 /api 프록시(rewrite) 경유. 쿠키 자동 포함.

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      ...(init.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(init.headers || {}),
    },
    ...init,
  });
  if (!res.ok) {
    let body: unknown = undefined;
    try {
      body = await res.json();
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, `HTTP ${res.status}`, body);
  }
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : ((await res.text()) as T);
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),
  patch: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T,>(path: string) => request<T>(path, { method: "DELETE" }),
};

export const fetcher = <T,>(path: string) => api.get<T>(path);

export type DiffType =
  | "added"
  | "removed"
  | "price_changed"
  | "model_name_changed"
  | "sku_changed_suspected"
  | "category_changed"
  | "unchanged";

export interface DiffItem {
  id: number;
  diff_type: DiffType;
  sku: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  match_confidence: number;
  source_ref: { row?: number } | null;
  selected: boolean;
}

export interface SessionSummary {
  id: number;
  status: string;
  summary: Partial<Record<DiffType, number>> | null;
  sheet_name?: string | null;
  header_row?: number;
  mapping?: Record<string, string | null> | null;
}

export interface PricelistVersion {
  id: number;
  source_filename: string;
  source_kind: "pdf" | "xlsx";
  effective_month: string | null;
  status: string;
  extraction_error: string | null;
  created_at: string;
}
