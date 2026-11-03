import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LEO — 영어 회화 연습",
  description: "개발자 해외 취업용 영어 회화 연습",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
