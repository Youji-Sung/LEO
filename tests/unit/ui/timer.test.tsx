import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Timer } from "@/components/ui/Timer";
import { callLive } from "@/content/ko";

describe("Timer", () => {
  it("renders a silent timer region with the default label and m:ss text", () => {
    const html = renderToStaticMarkup(<Timer remainingSec={125} totalSec={600} />);
    expect(html).toMatch(/^<div class="timer" role="timer" aria-live="off"/);
    expect(html).toContain(`aria-label="${callLive.timerLabel}"`);
    expect(html).toContain('data-testid="timer"');
    expect(html).toContain('data-warning="false"');
    expect(html).toContain("<span>2:05</span>");
  });

  it("hides the ring svg from assistive tech and draws a proportional fill", () => {
    const html = renderToStaticMarkup(<Timer remainingSec={300} totalSec={600} />);
    expect(html).toContain('<svg class="timer-ring" viewBox="0 0 40 40" aria-hidden="true">');
    expect(html).toContain('class="ring-track"');
    const dash = Number(html.match(/stroke-dasharray="([^"]+)"/)?.[1]);
    const offset = Number(html.match(/stroke-dashoffset="([^"]+)"/)?.[1]);
    expect(dash).toBeCloseTo(2 * Math.PI * 16);
    expect(offset).toBeCloseTo(dash / 2);
  });

  it("flags warning when remaining is at or below warnAtSec", () => {
    expect(renderToStaticMarkup(<Timer remainingSec={60} totalSec={600} />)).toContain('data-warning="true"');
    expect(renderToStaticMarkup(<Timer remainingSec={61} totalSec={600} />)).toContain('data-warning="false"');
    expect(renderToStaticMarkup(<Timer remainingSec={100} totalSec={600} warnAtSec={120} />)).toContain('data-warning="true"');
  });

  it("accepts a custom label and clamps the text at 0:00", () => {
    const html = renderToStaticMarkup(<Timer remainingSec={-5} totalSec={600} label="남은 통화 시간" />);
    expect(html).toContain('aria-label="남은 통화 시간"');
    expect(html).toContain("<span>0:00</span>");
    expect(html).toContain('data-warning="true"');
  });
});
