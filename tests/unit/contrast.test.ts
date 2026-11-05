import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { classify, contrastRatio, formatRatio, parseHex, relativeLuminance } from "@/lib/contrast";
import { contrastPairs, dark, light, renderTokensCss } from "@/design/tokens";
import { directionPalettes, renderDirectionTokensCss } from "@/design/directions";

describe("contrast math", () => {
  it("matches the WCAG reference values", () => {
    expect(relativeLuminance(parseHex("#ffffff"))).toBeCloseTo(1, 5);
    expect(relativeLuminance(parseHex("#000000"))).toBeCloseTo(0, 5);
    expect(formatRatio(contrastRatio("#ffffff", "#000000"))).toBe("21.00:1");
    expect(formatRatio(contrastRatio("#767676", "#ffffff"))).toBe("4.54:1");
    expect(classify(4.5)).toBe("AA");
    expect(classify(4.49)).toBe("AA-large");
    expect(classify(3, "ui")).toBe("AA");
    expect(classify(2.99, "ui")).toBe("fail");
  });
});

describe("design token palettes", () => {
  for (const [name, palette] of [
    ["light", light],
    ["dark", dark],
  ] as const) {
    describe(name, () => {
      for (const pair of contrastPairs) {
        it(`${pair.name} meets ${pair.kind === "text" ? "4.5:1" : "3:1"}`, () => {
          const ratio = contrastRatio(palette[pair.fg], palette[pair.bg]);
          const need = pair.kind === "text" ? 4.5 : 3;
          expect(
            ratio,
            `${palette[pair.fg]} on ${palette[pair.bg]} = ${formatRatio(ratio)}`,
          ).toBeGreaterThanOrEqual(need);
        });
      }
    });
  }

  it("keeps src/app/directions/tokens.css in sync with directions.ts", () => {
    const css = readFileSync(
      path.join(process.cwd(), "src", "app", "directions", "tokens.css"),
      "utf8",
    ).replace(/\r\n/g, "\n");
    expect(css).toBe(renderDirectionTokensCss());
  });

  it("keeps src/app/tokens.css in sync with tokens.ts", () => {
    const css = readFileSync(path.join(process.cwd(), "src", "app", "tokens.css"), "utf8").replace(
      /\r\n/g,
      "\n",
    );
    expect(css).toBe(renderTokensCss());
  });

  it("dark mode is not an inversion: surfaces get brighter as they rise", () => {
    const lum = (hex: string) => relativeLuminance(parseHex(hex));
    expect(lum(dark.canvas)).toBeLessThan(lum(dark.surface));
    expect(lum(dark.surface)).toBeLessThan(lum(dark.surfaceRaised));
    expect(lum(light.canvas)).toBeLessThan(lum(light.surface));
  });
});

// 디자인 시안(서재·무대·콘솔)의 팔레트도 같은 33쌍을 라이트·다크에서 지킨다(POLISH_PLAN 4단계).
describe("direction palettes", () => {
  for (const [direction, palettes] of Object.entries(directionPalettes)) {
    for (const [scheme, palette] of Object.entries(palettes)) {
      describe(`${direction} ${scheme}`, () => {
        for (const pair of contrastPairs) {
          it(`${pair.name} meets ${pair.kind === "text" ? "4.5:1" : "3:1"}`, () => {
            const ratio = contrastRatio(palette[pair.fg], palette[pair.bg]);
            const need = pair.kind === "text" ? 4.5 : 3;
            expect(
              ratio,
              `${palette[pair.fg]} on ${palette[pair.bg]} = ${formatRatio(ratio)}`,
            ).toBeGreaterThanOrEqual(need);
          });
        }
      });
    }
  }

  it("dark palettes are not inversions: surfaces get brighter as they rise", () => {
    const lum = (hex: string) => relativeLuminance(parseHex(hex));
    for (const { dark: d } of Object.values(directionPalettes)) {
      expect(lum(d.canvas)).toBeLessThan(lum(d.surface));
      expect(lum(d.surface)).toBeLessThanOrEqual(lum(d.surfaceRaised));
    }
  });
});
