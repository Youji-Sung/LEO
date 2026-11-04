import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { HydrationMarker } from "@/components/HydrationMarker";
import { RouteFocus } from "@/components/RouteFocus";
import { meta } from "@/content/ko";
import { THEME_COOKIE, themeAttribute } from "@/lib/theme";
import "./tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  title: meta.siteTitle,
  description: meta.siteDescription,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 라이트/다크 주소창 색은 tokens.ts 의 canvas 값과 같다.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f1" },
    { media: "(prefers-color-scheme: dark)", color: "#131315" },
  ],
};

// Pretendard Variable 다이나믹 서브셋(SYSTEM.md 2.1). 버전을 고정한다.
const PRETENDARD_CSS =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const theme = themeAttribute(store.get(THEME_COOKIE)?.value);
  return (
    <html lang="ko" data-theme={theme}>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href={PRETENDARD_CSS} crossOrigin="anonymous" />
      </head>
      <body>
        <HydrationMarker />
        <RouteFocus />
        {children}
      </body>
    </html>
  );
}
