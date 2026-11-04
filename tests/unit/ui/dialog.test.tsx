import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Dialog } from "@/components/ui/Dialog";
import { common } from "@/content/ko";

const noop = () => {};

function render(extra: Partial<Parameters<typeof Dialog>[0]> = {}) {
  return renderToStaticMarkup(<Dialog open={false} onClose={noop} onConfirm={noop} title="포트폴리오 삭제" confirmLabel={common.delete} {...extra} />);
}

describe("Dialog", () => {
  it("renders a <dialog> labelled by its h2 title", () => {
    const html = render();
    expect(html).toMatch(/^<dialog class="dialog" aria-labelledby="/);
    const titleId = html.match(/aria-labelledby="([^"]+)"/)?.[1];
    expect(titleId).toBeTruthy();
    expect(html).toContain(`<h2 id="${titleId}" class="t-title">포트폴리오 삭제</h2>`);
    expect(html).not.toContain("aria-describedby");
  });

  it("wires aria-describedby to the description paragraph", () => {
    const html = render({ description: "되돌릴 수 없어요." });
    const descId = html.match(/aria-describedby="([^"]+)"/)?.[1];
    expect(descId).toBeTruthy();
    expect(html).toContain(`<p id="${descId}">되돌릴 수 없어요.</p>`);
  });

  it("renders cancel (autofocused, secondary) and confirm (primary) buttons with their labels", () => {
    const html = render();
    expect(html).toContain('<div class="dialog-actions">');
    expect(html).toMatch(new RegExp(`<button type="button" class="btn btn-secondary"[^>]*autofocus=""[^>]*>${common.cancel}</button>`));
    expect(html).toContain(`<button type="button" class="btn btn-primary">${common.delete}</button>`);
  });

  it("uses a custom cancel label and renders children inside the body", () => {
    const html = render({ cancelLabel: common.close, children: <p data-i="child">본문</p> });
    expect(html).toContain(`${common.close}</button>`);
    expect(html).toContain('<div class="dialog-body">');
    expect(html).toContain('<p data-i="child">본문</p>');
  });

  it("makes the confirm button a danger button when danger is set", () => {
    const html = render({ danger: true });
    expect(html).toContain(`class="btn btn-danger">${common.delete}</button>`);
    expect(html).not.toContain("btn-primary");
  });

  it("disables cancel and marks confirm busy with a spinner while busy", () => {
    const html = render({ busy: true });
    expect(html).toMatch(/btn-secondary" disabled=""/);
    expect(html).toMatch(/class="btn btn-primary" disabled="" aria-busy="true"/);
    expect(html).toContain('class="spinner spinner-sm" aria-hidden="true"');
    expect(html).toContain(`${common.delete}</button>`);
  });
});
