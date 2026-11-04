// src/design/tokens.ts → src/app/tokens.css. `npx tsx scripts/build-tokens.ts` (--check 는 차이만 보고한다).
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { contrastPairs, dark, light, renderTokensCss } from "../src/design/tokens";
import { classify, contrastRatio, formatRatio } from "../src/lib/contrast";

const out = path.join(process.cwd(), "src", "app", "tokens.css");
const css = renderTokensCss();
if (process.argv.includes("--check")) {
  const current = readFileSync(out, "utf8");
  if (current !== css) {
    process.stderr.write(
      "tokens.css 가 tokens.ts 와 다릅니다. npx tsx scripts/build-tokens.ts 를 실행하세요.\n",
    );
    process.exit(1);
  }
} else {
  writeFileSync(out, css);
}

if (process.argv.includes("--table")) {
  const rows = [
    "| 조합 | 라이트 전경 | 라이트 배경 | 라이트 대비 | 다크 전경 | 다크 배경 | 다크 대비 | 요구 |",
    "|---|---|---|---:|---|---|---:|---|",
  ];
  for (const p of contrastPairs) {
    const l = contrastRatio(light[p.fg], light[p.bg]);
    const d = contrastRatio(dark[p.fg], dark[p.bg]);
    const need = p.kind === "text" ? "4.5:1" : "3:1";
    rows.push(
      `| ${p.name} | ${light[p.fg]} | ${light[p.bg]} | ${formatRatio(l)} (${classify(l, p.kind)}) | ${dark[p.fg]} | ${dark[p.bg]} | ${formatRatio(d)} (${classify(d, p.kind)}) | ${need} |`,
    );
  }
  process.stdout.write(rows.join("\n") + "\n");
}
