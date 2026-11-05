// 디자인 시안(사용자 기능). DB(UserSettings.direction)와 쿠키(leo_direction)에 같은 값을 두고,
// 루트 레이아웃이 쿠키로 <html data-direction> 을 서버 렌더한다. "basic" 은 기본 디자인(쿠키 없음).
export const DIRECTION_COOKIE = "leo_direction";
export const DIRECTION_QUERY = "direction";
export const DIRECTIONS = ["study", "stage", "console"] as const;
export type Direction = (typeof DIRECTIONS)[number];
export const DIRECTION_CHOICES = ["basic", ...DIRECTIONS] as const;
export type DirectionChoice = (typeof DIRECTION_CHOICES)[number];

export function isDirection(v: unknown): v is Direction {
  return typeof v === "string" && (DIRECTIONS as readonly string[]).includes(v);
}

export function isDirectionChoice(v: unknown): v is DirectionChoice {
  return typeof v === "string" && (DIRECTION_CHOICES as readonly string[]).includes(v);
}

export function directionCookieHeader(choice: DirectionChoice): string {
  const secure = (process.env.APP_URL ?? "").startsWith("https://") ? "; Secure" : "";
  const value = choice === "basic" ? "off" : choice;
  return `${DIRECTION_COOKIE}=${value}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}${secure}`;
}

export function resolveDirection(cookieValue: string | undefined): Direction | undefined {
  if (cookieValue === "off") return undefined;
  if (isDirection(cookieValue)) return cookieValue;
  const env = process.env.LEO_DIRECTION;
  return isDirection(env) ? env : undefined;
}

// 시안별 외부 폰트(Google Fonts CSS). 이유는 각 시안의 README 에 적는다.
export const DIRECTION_FONTS: Record<Direction, string[]> = {
  study: [
    "https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..700&display=swap",
  ],
  stage: [],
  console: [
    "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap",
  ],
};
