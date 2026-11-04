// 테마 모드(시스템/라이트/다크). DB(UserSettings.theme)와 쿠키(leo_theme)에 같은 값을 두고,
// 루트 레이아웃이 쿠키로 <html data-theme> 를 서버 렌더해 첫 페인트부터 올바른 테마를 적용한다(SYSTEM.md 1.3).
export const THEME_COOKIE = "leo_theme";
export const THEME_MODES = ["system", "light", "dark"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export function isThemeMode(v: unknown): v is ThemeMode {
  return typeof v === "string" && (THEME_MODES as readonly string[]).includes(v);
}

export function themeCookieHeader(mode: ThemeMode): string {
  const secure = (process.env.APP_URL ?? "").startsWith("https://") ? "; Secure" : "";
  return `${THEME_COOKIE}=${mode}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}${secure}`;
}

// "system" 이면 속성을 두지 않아 prefers-color-scheme 가 적용된다.
export function themeAttribute(mode: string | undefined): "light" | "dark" | undefined {
  return mode === "light" || mode === "dark" ? mode : undefined;
}

// 클라이언트에서 즉시 미리보기. 저장은 /api/settings 가 한다.
export function applyThemeToDocument(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  if (mode === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = mode;
}
