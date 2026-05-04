import type { ReactNode } from 'react';

export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r border-[var(--tl-border)] bg-[var(--tl-bg-muted)] p-4">
        <div className="mb-6 text-lg font-bold text-primary">TOOLBOX 판매자</div>
        <nav className="flex flex-col gap-2 text-sm">
          <a href="/seller">대시보드</a>
          <a href="/seller/bids">입찰 관리</a>
          <a href="/seller/orders">주문 처리</a>
          <a href="/seller/settlements">정산</a>
          <a href="/seller/settings">설정</a>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
