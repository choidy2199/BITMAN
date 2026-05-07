import Link from "next/link";
import { ReactNode } from "react";

const NAV = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/pricelists/upload", label: "본사 단가표 업로드" },
  { href: "/pricelists", label: "단가표 버전" },
  { href: "/compare/new", label: "비교 시작" },
  { href: "/history", label: "이력" },
];

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-white p-4">
        <div className="mb-6">
          <Link href="/dashboard" className="text-xl font-bold text-brand">
            BITMAN
          </Link>
          <p className="text-xs text-slate-500">Milwaukee 단가표 관리</p>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded px-3 py-2 text-sm hover:bg-slate-100"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <form action="/api/v1/auth/logout" method="post" className="mt-6">
          <button
            type="submit"
            className="text-xs text-slate-500 hover:text-brand"
            formMethod="post"
          >
            로그아웃
          </button>
        </form>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
