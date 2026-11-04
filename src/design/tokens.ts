// 디자인 토큰의 단일 출처. `scripts/build-tokens.ts` 가 src/app/tokens.css 를 생성하고,
// tests/unit/contrast.test.ts 가 아래 `contrastPairs` 의 대비를 고정한다. 근거: docs/design/SYSTEM.md

export type Palette = {
  canvas: string; // 페이지 배경
  surface: string; // 카드·헤더·입력창 배경
  surfaceRaised: string; // 다이얼로그·토스트 등 위에 뜨는 면
  surfaceSunken: string; // 코드·비활성·보조 영역
  text: string; // 본문
  textSecondary: string; // 보조 텍스트(메타, 설명)
  textPlaceholder: string; // 플레이스홀더
  border: string; // 입력창·버튼 경계 (3:1)
  divider: string; // 장식 구분선 (대비 요구 없음)
  accent: string; // 1차 행동, 상대가 말하는 중
  onAccent: string;
  accentSubtle: string; // 옅은 강조 배경(내 말풍선 아님, 배지)
  onAccentSubtle: string;
  positive: string;
  onPositive: string;
  positiveSubtle: string;
  onPositiveSubtle: string;
  caution: string;
  onCaution: string;
  cautionSubtle: string;
  onCautionSubtle: string;
  negative: string;
  onNegative: string;
  negativeSubtle: string;
  onNegativeSubtle: string;
  focus: string; // 포커스 링
  bubbleMe: string; // 내 말풍선 배경
  onBubbleMe: string;
  bubblePartner: string; // 상대 말풍선 배경
  onBubblePartner: string;
  scrim: string; // 다이얼로그 뒤 가림막(투명도 포함)
};

export const light: Palette = {
  canvas: "#f4f4f1",
  surface: "#ffffff",
  surfaceRaised: "#ffffff",
  surfaceSunken: "#ebebe7",
  text: "#1b1b19",
  textSecondary: "#5b5b57",
  textPlaceholder: "#6b6b66",
  border: "#8b8b86",
  divider: "#e2e2dd",
  accent: "#2554c7",
  onAccent: "#ffffff",
  accentSubtle: "#e3ebfb",
  onAccentSubtle: "#1b3f94",
  positive: "#1e7340",
  onPositive: "#ffffff",
  positiveSubtle: "#e1f3e6",
  onPositiveSubtle: "#155a31",
  caution: "#8a5300",
  onCaution: "#ffffff",
  cautionSubtle: "#fff1d6",
  onCautionSubtle: "#6e4200",
  negative: "#b8322a",
  onNegative: "#ffffff",
  negativeSubtle: "#fde7e5",
  onNegativeSubtle: "#8f2620",
  focus: "#2554c7",
  bubbleMe: "#2554c7",
  onBubbleMe: "#ffffff",
  bubblePartner: "#ffffff",
  onBubblePartner: "#1b1b19",
  scrim: "rgba(27, 27, 25, 0.5)",
};

export const dark: Palette = {
  canvas: "#131315",
  surface: "#1d1d21",
  surfaceRaised: "#27272c",
  surfaceSunken: "#0f0f11",
  text: "#ededea",
  textSecondary: "#b3b3ae",
  textPlaceholder: "#a3a39e",
  border: "#8a8a90",
  divider: "#34343a",
  accent: "#9fbcff",
  onAccent: "#0d1f4f",
  accentSubtle: "#1f2d52",
  onAccentSubtle: "#c6d6ff",
  positive: "#7fd49a",
  onPositive: "#06301a",
  positiveSubtle: "#17331f",
  onPositiveSubtle: "#a6e4b8",
  caution: "#f2c56b",
  onCaution: "#3a2600",
  cautionSubtle: "#3a2e12",
  onCautionSubtle: "#f7d998",
  negative: "#ff9a92",
  onNegative: "#4a0e0a",
  negativeSubtle: "#46201e",
  onNegativeSubtle: "#ffb9b3",
  focus: "#9fbcff",
  bubbleMe: "#2b4fa3",
  onBubbleMe: "#f3f6ff",
  bubblePartner: "#27272c",
  onBubblePartner: "#ededea",
  scrim: "rgba(0, 0, 0, 0.6)",
};

export type ContrastKind = "text" | "large-text" | "ui";
export type ContrastPair = {
  name: string;
  fg: keyof Palette;
  bg: keyof Palette;
  kind: ContrastKind;
};

// 대비를 보장해야 하는 전경/배경 조합. 텍스트 4.5:1, 큰 텍스트·UI 3:1.
export const contrastPairs: ContrastPair[] = [
  { name: "본문/캔버스", fg: "text", bg: "canvas", kind: "text" },
  { name: "본문/표면", fg: "text", bg: "surface", kind: "text" },
  { name: "본문/올라온 표면", fg: "text", bg: "surfaceRaised", kind: "text" },
  { name: "본문/가라앉은 표면", fg: "text", bg: "surfaceSunken", kind: "text" },
  { name: "보조 텍스트/캔버스", fg: "textSecondary", bg: "canvas", kind: "text" },
  { name: "보조 텍스트/표면", fg: "textSecondary", bg: "surface", kind: "text" },
  { name: "보조 텍스트/가라앉은 표면", fg: "textSecondary", bg: "surfaceSunken", kind: "text" },
  { name: "플레이스홀더/표면", fg: "textPlaceholder", bg: "surface", kind: "text" },
  { name: "경계/표면", fg: "border", bg: "surface", kind: "ui" },
  { name: "경계/캔버스", fg: "border", bg: "canvas", kind: "ui" },
  { name: "강조 텍스트(링크)/캔버스", fg: "accent", bg: "canvas", kind: "text" },
  { name: "강조 텍스트(링크)/표면", fg: "accent", bg: "surface", kind: "text" },
  { name: "강조 위 텍스트/강조", fg: "onAccent", bg: "accent", kind: "text" },
  { name: "옅은 강조 위 텍스트/옅은 강조", fg: "onAccentSubtle", bg: "accentSubtle", kind: "text" },
  { name: "긍정 텍스트/표면", fg: "positive", bg: "surface", kind: "text" },
  { name: "긍정 텍스트/캔버스", fg: "positive", bg: "canvas", kind: "text" },
  { name: "긍정 위 텍스트/긍정", fg: "onPositive", bg: "positive", kind: "text" },
  {
    name: "옅은 긍정 위 텍스트/옅은 긍정",
    fg: "onPositiveSubtle",
    bg: "positiveSubtle",
    kind: "text",
  },
  { name: "주의 텍스트/표면", fg: "caution", bg: "surface", kind: "text" },
  { name: "주의 위 텍스트/주의", fg: "onCaution", bg: "caution", kind: "text" },
  {
    name: "옅은 주의 위 텍스트/옅은 주의",
    fg: "onCautionSubtle",
    bg: "cautionSubtle",
    kind: "text",
  },
  { name: "부정 텍스트/표면", fg: "negative", bg: "surface", kind: "text" },
  { name: "부정 텍스트/캔버스", fg: "negative", bg: "canvas", kind: "text" },
  { name: "부정 위 텍스트/부정", fg: "onNegative", bg: "negative", kind: "text" },
  {
    name: "옅은 부정 위 텍스트/옅은 부정",
    fg: "onNegativeSubtle",
    bg: "negativeSubtle",
    kind: "text",
  },
  { name: "포커스 링/표면", fg: "focus", bg: "surface", kind: "ui" },
  { name: "포커스 링/캔버스", fg: "focus", bg: "canvas", kind: "ui" },
  { name: "내 말풍선 텍스트/내 말풍선", fg: "onBubbleMe", bg: "bubbleMe", kind: "text" },
  {
    name: "상대 말풍선 텍스트/상대 말풍선",
    fg: "onBubblePartner",
    bg: "bubblePartner",
    kind: "text",
  },
  { name: "강조(UI: 점수 바·아이콘)/표면", fg: "accent", bg: "surface", kind: "ui" },
  { name: "긍정(UI)/표면", fg: "positive", bg: "surface", kind: "ui" },
  { name: "주의(UI)/표면", fg: "caution", bg: "surface", kind: "ui" },
  { name: "부정(UI)/표면", fg: "negative", bg: "surface", kind: "ui" },
];
// 요구가 없는 조합(참고): 옅은 배지 배경/표면, 표면/캔버스. 배지와 카드는 텍스트·경계·그림자로 식별하므로 1.4.11 대상이 아니다.

// 색 외 토큰. 값은 SYSTEM.md 표와 같다.
export const scale = {
  space: {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    7: "32px",
    8: "40px",
    9: "48px",
    10: "64px",
  },
  radius: { sm: "6px", md: "10px", lg: "14px", xl: "20px", full: "999px" },
  font: {
    sans: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  },
  type: {
    // 이름: [크기, 줄 높이, 굵기, 자간]
    display: ["2.5rem", "1.15", "700", "-0.02em"],
    headline: ["1.5rem", "1.3", "700", "-0.01em"],
    title: ["1.125rem", "1.4", "600", "0"],
    body: ["1rem", "1.6", "400", "0"],
    bodyStrong: ["1rem", "1.6", "600", "0"],
    small: ["0.875rem", "1.5", "400", "0"],
    label: ["0.875rem", "1.3", "500", "0"],
    caption: ["0.75rem", "1.4", "400", "0"],
    english: ["1.0625rem", "1.55", "400", "0"],
  },
  shadow: {
    sm: "0 1px 2px rgba(20, 20, 18, 0.06), 0 1px 1px rgba(20, 20, 18, 0.04)",
    md: "0 4px 12px rgba(20, 20, 18, 0.10), 0 1px 3px rgba(20, 20, 18, 0.06)",
    lg: "0 12px 32px rgba(20, 20, 18, 0.18), 0 2px 6px rgba(20, 20, 18, 0.08)",
  },
  motion: {
    fast: "150ms",
    base: "250ms",
    slow: "400ms",
    pulse: "1600ms",
    easeStandard: "cubic-bezier(0.2, 0, 0, 1)",
    easeEnter: "cubic-bezier(0, 0, 0, 1)",
    easeExit: "cubic-bezier(0.3, 0, 1, 1)",
  },
  breakpoint: { sm: "480px", md: "768px", lg: "1024px" },
  target: { min: "44px", call: "56px" },
} as const;

function kebab(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

function paletteBlock(p: Palette): string {
  return (Object.keys(p) as (keyof Palette)[])
    .map((k) => `  --color-${kebab(k)}: ${p[k]};`)
    .join("\n");
}

// src/app/tokens.css 의 내용. 손으로 고치지 않고 `npx tsx scripts/build-tokens.ts` 로 다시 만든다.
export function renderTokensCss(): string {
  const lines: string[] = [];
  lines.push(
    "/* 생성 파일. 원본은 src/design/tokens.ts, 생성은 scripts/build-tokens.ts. 직접 고치지 않는다. */",
    "",
  );
  lines.push(":root {", paletteBlock(light), "  color-scheme: light;", "");
  for (const [k, v] of Object.entries(scale.space)) lines.push(`  --space-${k}: ${v};`);
  for (const [k, v] of Object.entries(scale.radius)) lines.push(`  --radius-${k}: ${v};`);
  lines.push(`  --font-sans: ${scale.font.sans};`, `  --font-mono: ${scale.font.mono};`);
  for (const [k, v] of Object.entries(scale.type)) {
    lines.push(
      `  --type-${kebab(k)}-size: ${v[0]};`,
      `  --type-${kebab(k)}-line: ${v[1]};`,
      `  --type-${kebab(k)}-weight: ${v[2]};`,
      `  --type-${kebab(k)}-tracking: ${v[3]};`,
    );
  }
  for (const [k, v] of Object.entries(scale.shadow)) lines.push(`  --shadow-${k}: ${v};`);
  for (const [k, v] of Object.entries(scale.motion)) lines.push(`  --motion-${kebab(k)}: ${v};`);
  for (const [k, v] of Object.entries(scale.target)) lines.push(`  --target-${k}: ${v};`);
  lines.push("}", "");
  lines.push(
    "@media (prefers-color-scheme: dark) {",
    '  :root:not([data-theme="light"]) {',
    paletteBlock(dark).replace(/^/gm, "  "),
    "    color-scheme: dark;",
    "  }",
    "}",
    "",
  );
  lines.push(':root[data-theme="dark"] {', paletteBlock(dark), "  color-scheme: dark;", "}", "");
  lines.push(
    "@media (prefers-reduced-motion: reduce) {",
    "  :root {",
    "    --motion-fast: 0ms;",
    "    --motion-base: 0ms;",
    "    --motion-slow: 0ms;",
    "    --motion-pulse: 0ms;",
    "  }",
    "}",
    "",
  );
  return lines.join("\n");
}
