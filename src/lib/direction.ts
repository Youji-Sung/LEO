// 시각 방향 시안 전환(1차 세션). 쿠키 leo_direction 또는 LEO_DIRECTION 환경 변수로 고른다.
// 값이 없으면 현행 디자인이다. 근거: docs/design/directions/01-exploration.md 4절.
export const DIRECTION_COOKIE = "leo_direction";
export const DIRECTION_QUERY = "direction";
export const DIRECTIONS = ["study", "stage", "console"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export function isDirection(v: unknown): v is Direction {
  return typeof v === "string" && (DIRECTIONS as readonly string[]).includes(v);
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
