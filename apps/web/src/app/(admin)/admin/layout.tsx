import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r border-[var(--tl-border)] bg-section p-4 text-white">
        <div className="mb-6 text-lg font-bold">TOOLBOX 관리자</div>
        <nav className="flex flex-col gap-2 text-sm">
          <a href="/admin">대시보드</a>
          <a href="/admin/products">제품 관리</a>
          <a href="/admin/brands">브랜드</a>
          <a href="/admin/sellers">판매자</a>
          <a href="/admin/orders">주문</a>
          <a href="/admin/settlements">정산</a>
          <a href="/admin/commission">수수료</a>
          <a href="/admin/users">회원</a>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
