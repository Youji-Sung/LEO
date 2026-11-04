import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DiffText } from "@/components/ui/DiffText";
import { report } from "@/content/ko";

describe("DiffText", () => {
  it("renders both labelled lines with lang=en and no strikethrough", () => {
    const html = renderToStaticMarkup(<DiffText original="I go to school yesterday." corrected="I went to school yesterday." />);
    expect(html).toMatch(/^<div class="diff">/);
    expect(html).toContain(`<span class="diff-label">${report.original}</span><span class="orig" lang="en">I go to school yesterday.</span>`);
    expect(html).toContain(`<span class="diff-label">${report.corrected}</span><span class="fixed" lang="en">I went to school yesterday.</span>`);
    expect(html).not.toContain("<del");
    expect(html).not.toContain("<s>");
    expect(html).not.toContain("diff-explain");
    expect(html).not.toContain("diff-example");
  });

  it("renders explanation, meaning and example when given", () => {
    const html = renderToStaticMarkup(<DiffText original="a" corrected="b" explanation="과거 시제를 써요." meaning="어제 학교에 갔다" example="I went home early." />);
    expect(html).toContain('<p class="diff-explain">과거 시제를 써요.</p>');
    expect(html).toContain(`<p class="diff-explain">${report.meaning}: 어제 학교에 갔다</p>`);
    expect(html).toContain(`<p class="diff-example">${report.example}: <span lang="en">I went home early.</span></p>`);
  });

  it("accepts custom line labels", () => {
    const html = renderToStaticMarkup(<DiffText original="a" corrected="b" originalLabel="원래 표현" correctedLabel="더 자연스러운 표현" />);
    expect(html).toContain('<span class="diff-label">원래 표현</span>');
    expect(html).toContain('<span class="diff-label">더 자연스러운 표현</span>');
    expect(html).not.toContain(report.original);
  });
});
