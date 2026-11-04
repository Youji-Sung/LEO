import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CallStatus, type CallState } from "@/components/ui/CallStatus";
import { callLive } from "@/content/ko";

const labels: Record<CallState, string> = {
  listening: callLive.status.listening,
  speaking: callLive.status.speaking,
  thinking: callLive.status.thinking,
  muted: callLive.status.muted,
  waiting: callLive.status.waitingInput,
  ending: callLive.status.ending,
  ended: callLive.status.ended,
};

describe("CallStatus", () => {
  it.each(Object.keys(labels) as CallState[])("renders %s as a status region with its Korean label", (state) => {
    const html = renderToStaticMarkup(<CallStatus state={state} />);
    expect(html).toMatch(/^<div class="call-status" data-state="[a-z]+" role="status" data-testid="call-status">/);
    expect(html).toContain(`data-state="${state}"`);
    expect(html).toContain(`<span>${labels[state]}</span>`);
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("call-status-sub");
  });

  it("renders the sub text after the label", () => {
    const html = renderToStaticMarkup(<CallStatus state="muted" sub="말하려면 음소거를 해제하세요" />);
    expect(html).toContain(`<span>${callLive.status.muted}</span><span class="call-status-sub">말하려면 음소거를 해제하세요</span>`);
  });

  it("spins the icon only while thinking or ending", () => {
    expect(renderToStaticMarkup(<CallStatus state="thinking" />)).toContain("spinner-icon");
    expect(renderToStaticMarkup(<CallStatus state="ending" />)).toContain("spinner-icon");
    expect(renderToStaticMarkup(<CallStatus state="listening" />)).not.toContain("spinner-icon");
  });
});
