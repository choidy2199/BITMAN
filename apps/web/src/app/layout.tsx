import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'TOOLBOX — 산업용 공구 최저가 마켓',
    template: '%s | TOOLBOX',
  },
  description: '판매자가 가격을 입찰하고, 소비자가 최저가로 구매하는 공구 마켓플레이스',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white text-[var(--tl-text)] antialiased">{children}</body>
    </html>
  );
}
