// 디자인 시안(서재·무대·콘솔)의 색 팔레트. 단일 출처이며 `scripts/build-tokens.ts` 가
// src/app/directions/tokens.css 를 생성하고, tests/unit/contrast.test.ts 가 네 시안 × 라이트/다크 대비를 고정한다.
// 서체·간격·라운드 같은 비색 토큰은 각 시안 CSS(src/app/directions/<이름>.css)에 그대로 둔다.
import type { Palette } from "@/design/tokens";
import type { Direction } from "@/lib/direction";

export type DirectionPalettes = { light: Palette; dark: Palette };

const studyLight: Palette = {
  canvas: "#f5f0e6",
  surface: "#faf6ee",
  surfaceRaised: "#fcf9f3",
  surfaceSunken: "#ebe4d6",
  text: "#221c15",
  textSecondary: "#5c5247",
  textPlaceholder: "#675d51",
  border: "#857a6c",
  divider: "#d8cfbf",
  accent: "#221c15",
  onAccent: "#f5f0e6",
  accentSubtle: "#e8e0d0",
  onAccentSubtle: "#221c15",
  positive: "#2f6b40",
  onPositive: "#f5f0e6",
  positiveSubtle: "#e1e8d6",
  onPositiveSubtle: "#245233",
  caution: "#855417",
  onCaution: "#f5f0e6",
  cautionSubtle: "#efe2c6",
  onCautionSubtle: "#664010",
  negative: "#a83a2f",
  onNegative: "#f5f0e6",
  negativeSubtle: "#f0dad3",
  onNegativeSubtle: "#7f2b22",
  focus: "#221c15",
  bubbleMe: "#f5f0e6",
  onBubbleMe: "#221c15",
  bubblePartner: "#f5f0e6",
  onBubblePartner: "#221c15",
  scrim: "rgba(34, 28, 21, 0.55)",
};

const studyDark: Palette = {
  canvas: "#171310",
  surface: "#1d1814",
  surfaceRaised: "#262019",
  surfaceSunken: "#100d0a",
  text: "#ece4d4",
  textSecondary: "#b3a893",
  textPlaceholder: "#a79c86",
  border: "#8a7e6c",
  divider: "#3b3329",
  accent: "#ece4d4",
  onAccent: "#171310",
  accentSubtle: "#2e2720",
  onAccentSubtle: "#ece4d4",
  positive: "#9ec99c",
  onPositive: "#171310",
  positiveSubtle: "#24332a",
  onPositiveSubtle: "#b9d8b5",
  caution: "#d7b26b",
  onCaution: "#171310",
  cautionSubtle: "#3a2f19",
  onCautionSubtle: "#e5ca8f",
  negative: "#e08d7e",
  onNegative: "#171310",
  negativeSubtle: "#40241f",
  onNegativeSubtle: "#f0b5a9",
  focus: "#ece4d4",
  bubbleMe: "#171310",
  onBubbleMe: "#ece4d4",
  bubblePartner: "#171310",
  onBubblePartner: "#ece4d4",
  scrim: "rgba(0, 0, 0, 0.65)",
};

const stageLight: Palette = {
  canvas: "#fff6e9",
  surface: "#ffffff",
  surfaceRaised: "#ffffff",
  surfaceSunken: "#ffe9d0",
  text: "#1a1512",
  textSecondary: "#5e5047",
  textPlaceholder: "#6b5d53",
  border: "#8a7768",
  divider: "#f1dcc2",
  accent: "#d1370f",
  onAccent: "#ffffff",
  accentSubtle: "#ffe0d5",
  onAccentSubtle: "#8e2408",
  positive: "#1b7a3e",
  onPositive: "#ffffff",
  positiveSubtle: "#dcf4e1",
  onPositiveSubtle: "#115a2c",
  caution: "#8a5300",
  onCaution: "#ffffff",
  cautionSubtle: "#ffeab5",
  onCautionSubtle: "#653c00",
  negative: "#b5173a",
  onNegative: "#ffffff",
  negativeSubtle: "#ffdfe4",
  onNegativeSubtle: "#8a0f2a",
  focus: "#1a1512",
  bubbleMe: "#d1370f",
  onBubbleMe: "#ffffff",
  bubblePartner: "#ffffff",
  onBubblePartner: "#1a1512",
  scrim: "rgba(26, 21, 18, 0.6)",
};

// 무대의 다크 팔레트는 통화 화면(.call-shell)에서 라이트 모드에도 그대로 쓰인다(어두운 무대).
const stageDark: Palette = {
  canvas: "#141210",
  surface: "#1f1b18",
  surfaceRaised: "#2a2521",
  surfaceSunken: "#0d0b0a",
  text: "#fff4e6",
  textSecondary: "#c8b7a8",
  textPlaceholder: "#b3a293",
  border: "#9c8a7c",
  divider: "#38302a",
  accent: "#ff7a5c",
  onAccent: "#2b0d05",
  accentSubtle: "#4a1a0e",
  onAccentSubtle: "#ffb9a7",
  positive: "#6fd48c",
  onPositive: "#04301a",
  positiveSubtle: "#16331f",
  onPositiveSubtle: "#a6e4b8",
  caution: "#f2c56b",
  onCaution: "#3a2600",
  cautionSubtle: "#3a2e12",
  onCautionSubtle: "#f7d998",
  negative: "#ff6b7e",
  onNegative: "#3d0410",
  negativeSubtle: "#4a1a22",
  onNegativeSubtle: "#ffb6c0",
  focus: "#fff4e6",
  bubbleMe: "#ff7a5c",
  onBubbleMe: "#2b0d05",
  bubblePartner: "#2a2521",
  onBubblePartner: "#fff4e6",
  scrim: "rgba(0, 0, 0, 0.65)",
};

const consoleLight: Palette = {
  canvas: "#f6f8fa",
  surface: "#ffffff",
  surfaceRaised: "#ffffff",
  surfaceSunken: "#eaeef2",
  text: "#1f2328",
  textSecondary: "#57606a",
  textPlaceholder: "#656d76",
  border: "#7d8590",
  divider: "#d0d7de",
  accent: "#0e7490",
  onAccent: "#ffffff",
  accentSubtle: "#d6f1f7",
  onAccentSubtle: "#0a5466",
  positive: "#187232",
  onPositive: "#ffffff",
  positiveSubtle: "#dafbe1",
  onPositiveSubtle: "#0f5323",
  caution: "#8a5c00",
  onCaution: "#ffffff",
  cautionSubtle: "#fff3c4",
  onCautionSubtle: "#6b4700",
  negative: "#c5202c",
  onNegative: "#ffffff",
  negativeSubtle: "#ffebe9",
  onNegativeSubtle: "#9b1420",
  focus: "#0e7490",
  bubbleMe: "#f6f8fa",
  onBubbleMe: "#1f2328",
  bubblePartner: "#ffffff",
  onBubblePartner: "#1f2328",
  scrim: "rgba(31, 35, 40, 0.5)",
};

const consoleDark: Palette = {
  canvas: "#0d1117",
  surface: "#161b22",
  surfaceRaised: "#1c2129",
  surfaceSunken: "#090c10",
  text: "#e6edf3",
  textSecondary: "#9ba5b1",
  textPlaceholder: "#8b949e",
  border: "#6e7681",
  divider: "#30363d",
  accent: "#39c5e0",
  onAccent: "#0d1117",
  accentSubtle: "#0e2a33",
  onAccentSubtle: "#7fdcef",
  positive: "#3fb950",
  onPositive: "#0d1117",
  positiveSubtle: "#12261a",
  onPositiveSubtle: "#7ee787",
  caution: "#d29922",
  onCaution: "#0d1117",
  cautionSubtle: "#2b2210",
  onCautionSubtle: "#e3b341",
  negative: "#ff7b72",
  onNegative: "#0d1117",
  negativeSubtle: "#35191b",
  onNegativeSubtle: "#ffa198",
  focus: "#39c5e0",
  bubbleMe: "#0d1117",
  onBubbleMe: "#e6edf3",
  bubblePartner: "#161b22",
  onBubblePartner: "#e6edf3",
  scrim: "rgba(1, 4, 9, 0.7)",
};

export const directionPalettes: Record<Direction, DirectionPalettes> = {
  study: { light: studyLight, dark: studyDark },
  stage: { light: stageLight, dark: stageDark },
  console: { light: consoleLight, dark: consoleDark },
};

function kebab(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

function block(p: Palette, scheme: "light" | "dark", indent: string): string {
  const lines = (Object.keys(p) as (keyof Palette)[]).map(
    (k) => `${indent}--color-${kebab(k)}: ${p[k]};`,
  );
  lines.push(`${indent}color-scheme: ${scheme};`);
  return lines.join("\n");
}

// src/app/directions/tokens.css 의 내용. 손으로 고치지 않고 `npx tsx scripts/build-tokens.ts` 로 다시 만든다.
export function renderDirectionTokensCss(): string {
  const out: string[] = [
    "/* 생성 파일. 원본은 src/design/directions.ts, 생성은 scripts/build-tokens.ts. 직접 고치지 않는다. */",
    "/* 시안 색 토큰: 라이트 → 시스템 다크 → 수동 다크. 비색 토큰은 각 시안 CSS 에 있다. */",
    "",
  ];
  for (const name of Object.keys(directionPalettes) as Direction[]) {
    const { light, dark } = directionPalettes[name];
    out.push(`:root[data-direction="${name}"] {`, block(light, "light", "  "), "}", "");
    out.push(
      "@media (prefers-color-scheme: dark) {",
      `  :root[data-direction="${name}"]:not([data-theme="light"]) {`,
      block(dark, "dark", "    "),
      "  }",
      "}",
      "",
    );
    out.push(
      `:root[data-direction="${name}"][data-theme="dark"] {`,
      block(dark, "dark", "  "),
      "}",
      "",
    );
  }
  // 무대: 통화 화면은 라이트·다크 모두 어두운 무대(stage/README.md 4절).
  out.push(
    '[data-direction="stage"] .call-shell {',
    block(directionPalettes.stage.dark, "dark", "  "),
    "}",
    "",
  );
  return out.join("\n");
}
