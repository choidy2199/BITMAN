import type { ReactNode } from 'react';

export default function BuyerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[var(--tl-border)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <a href="/" className="text-xl font-bold text-primary">
            TOOLBOX
          </a>
          <nav className="flex items-center gap-6 text-sm">
            <a href="/products">전체 제품</a>
            <a href="/mypage">마이페이지</a>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-[var(--tl-border)] py-8 text-center text-sm text-[var(--tl-text-muted)]">
        TOOLBOX · 산업용 공구 입찰형 마켓
      </footer>
    </div>
  );
}
