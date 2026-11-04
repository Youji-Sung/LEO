import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ScoreGauge, scoreBand } from "@/components/ui/ScoreGauge";
import { report } from "@/content/ko";

const label = report.scoreLabels.grammar;

describe("scoreBand", () => {
  it("splits at 8 and 5", () => {
    expect(scoreBand(10)).toBe("high");
    expect(scoreBand(8)).toBe("high");
    expect(scoreBand(7)).toBe("mid");
    expect(scoreBand(5)).toBe("mid");
    expect(scoreBand(4)).toBe("low");
    expect(scoreBand(1)).toBe("low");
  });
});

describe("ScoreGauge", () => {
  it.each([
    [9, "high", "positive"],
    [6, "mid", "accent"],
    [3, "low", "caution"],
  ] as const)("score %i → band %s with a %s badge", (score, band, tone) => {
    const html = renderToStaticMarkup(<ScoreGauge label={label} score={score} comment="한마디" />);
    expect(html).toContain('data-testid="score"');
    expect(html).toContain(`data-band="${band}"`);
    expect(html).toContain(`role="img" aria-label="${report.scoreAria(label, score)}, ${report.scoreBand(score)}"`);
    expect(html).toContain(`<span class="badge badge-${tone}">${report.scoreBand(score)}</span>`);
    expect(html).toContain(`<span class="score-value">${report.scoreOf(score)}</span>`);
    expect(html).toContain(`style="width:${score * 10}%"`);
  });

  it("renders the visible label and comment", () => {
    const html = renderToStaticMarkup(<ScoreGauge label={label} score={7} comment="관사를 더 신경 쓰세요." />);
    expect(html).toContain(`<span class="t-label">${label}</span>`);
    expect(html).toContain('<p class="score-comment">관사를 더 신경 쓰세요.</p>');
    expect(html).toContain('<div class="score-bar"><div class="score-fill" style="width:70%"></div></div>');
  });
});
