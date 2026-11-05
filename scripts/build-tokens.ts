// src/design/tokens.ts → src/app/tokens.css, src/design/directions.ts → src/app/directions/tokens.css.
// `npx tsx scripts/build-tokens.ts` (--check 는 차이만 보고한다, --table 은 대비 표를 출력한다).
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { directionPalettes, renderDirectionTokensCss } from "../src/design/directions";
import { contrastPairs, dark, light, renderTokensCss, type Palette } from "../src/design/tokens";
import { classify, contrastRatio, formatRatio } from "../src/lib/contrast";

const targets: Array<{ out: string; css: string }> = [
  { out: path.join(process.cwd(), "src", "app", "tokens.css"), css: renderTokensCss() },
  {
    out: path.join(process.cwd(), "src", "app", "directions", "tokens.css"),
    css: renderDirectionTokensCss(),
  },
];
for (const { out, css } of targets) {
  if (process.argv.includes("--check")) {
    const current = readFileSync(out, "utf8");
    if (current !== css) {
      process.stderr.write(
        `${path.relative(process.cwd(), out)} 가 원본 TS 와 다릅니다. npx tsx scripts/build-tokens.ts 를 실행하세요.\n`,
      );
      process.exit(1);
    }
  } else {
    writeFileSync(out, css);
  }
}

function table(l: Palette, d: Palette): string[] {
  const rows = [
    "| 조합 | 라이트 전경 | 라이트 배경 | 라이트 대비 | 다크 전경 | 다크 배경 | 다크 대비 | 요구 |",
    "|---|---|---|---:|---|---|---:|---|",
  ];
  for (const p of contrastPairs) {
    const lr = contrastRatio(l[p.fg], l[p.bg]);
    const dr = contrastRatio(d[p.fg], d[p.bg]);
    const need = p.kind === "text" ? "4.5:1" : "3:1";
    rows.push(
      `| ${p.name} | ${l[p.fg]} | ${l[p.bg]} | ${formatRatio(lr)} (${classify(lr, p.kind)}) | ${d[p.fg]} | ${d[p.bg]} | ${formatRatio(dr)} (${classify(dr, p.kind)}) | ${need} |`,
    );
  }
  return rows;
}

if (process.argv.includes("--table")) {
  const lines = ["## basic", ...table(light, dark)];
  for (const [name, p] of Object.entries(directionPalettes)) {
    lines.push("", `## ${name}`, ...table(p.light, p.dark));
  }
  process.stdout.write(lines.join("\n") + "\n");
}
