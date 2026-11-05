import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { HydrationMarker } from "@/components/HydrationMarker";
import { RouteFocus } from "@/components/RouteFocus";
import { meta } from "@/content/ko";
import { DIRECTION_COOKIE, DIRECTION_FONTS, resolveDirection } from "@/lib/direction";
import { THEME_COOKIE, themeAttribute } from "@/lib/theme";
import "./tokens.css";
import "./globals.css";
import "./directions/study.css";
import "./directions/stage.css";
import "./directions/console.css";

export const metadata: Metadata = {
  title: meta.siteTitle,
  description: meta.siteDescription,
};

// 라이트/다크 주소창 색은 tokens.ts 의 canvas 값과 같다. 수동 테마면 그 값 하나만 준다.
export async function generateViewport(): Promise<Viewport> {
  const store = await cookies();
  const theme = themeAttribute(store.get(THEME_COOKIE)?.value);
  return {
    width: "device-width",
    initialScale: 1,
    themeColor:
      theme === "light"
        ? "#f4f4f1"
        : theme === "dark"
          ? "#131315"
          : [
              { media: "(prefers-color-scheme: light)", color: "#f4f4f1" },
              { media: "(prefers-color-scheme: dark)", color: "#131315" },
            ],
  };
}

// Pretendard Variable 다이나믹 서브셋(SYSTEM.md 2.1). 버전을 고정한다.
const PRETENDARD_CSS =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const theme = themeAttribute(store.get(THEME_COOKIE)?.value);
  // 시각 방향 시안(1차 세션): 쿠키/환경 변수로 고른 시안의 속성과 폰트만 더한다. 없으면 현행.
  const direction = resolveDirection(store.get(DIRECTION_COOKIE)?.value);
  const fonts = direction ? DIRECTION_FONTS[direction] : [];
  return (
    <html lang="ko" data-theme={theme} data-direction={direction}>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href={PRETENDARD_CSS} crossOrigin="anonymous" />
        {fonts.length > 0 ? (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            {fonts.map((href) => (
              <link key={href} rel="stylesheet" href={href} />
            ))}
          </>
        ) : null}
      </head>
      <body>
        <HydrationMarker />
        <RouteFocus />
        {children}
      </body>
    </html>
  );
}
