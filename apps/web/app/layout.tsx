import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BITMAN — Milwaukee 단가표 관리",
  description: "본사 PDF/Excel 단가표와 사용자 Excel을 비교·머지",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
