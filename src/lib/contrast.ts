// WCAG 2.x 상대 휘도·대비율 계산. 디자인 토큰 대비 검증(테스트)과 감사 스크립트가 함께 쓴다.
// 출처: https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio , #dfn-relative-luminance

export type Rgb = { r: number; g: number; b: number };

export function parseHex(hex: string): Rgb {
  const h = hex.trim().replace(/^#/, "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`올바른 16진수 색이 아닙니다: ${hex}`);
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(rgb: Rgb): number {
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

export function contrastRatio(fg: string | Rgb, bg: string | Rgb): number {
  const l1 = relativeLuminance(typeof fg === "string" ? parseHex(fg) : fg);
  const l2 = relativeLuminance(typeof bg === "string" ? parseHex(bg) : bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// 소수점 둘째 자리까지 (WCAG 문서 표기 방식)
export function formatRatio(ratio: number): string {
  return `${(Math.floor(ratio * 100) / 100).toFixed(2)}:1`;
}

export type ContrastLevel = "AAA" | "AA" | "AA-large" | "fail";

// 일반 텍스트 4.5:1, 큰 텍스트(18pt/24px 이상 또는 14pt/18.66px 굵게) 3:1, UI 컴포넌트·그래픽 3:1
export function classify(ratio: number, kind: "text" | "large-text" | "ui" = "text"): ContrastLevel {
  if (kind === "text") return ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA-large" : "fail";
  return ratio >= 4.5 ? "AAA" : ratio >= 3 ? "AA" : "fail";
}
