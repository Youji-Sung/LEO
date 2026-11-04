import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { banner } from "@/content/ko";

describe("StatusMessage", () => {
  it.each(["info", "success"] as const)("%s uses role=status", (tone) => {
    const html = renderToStaticMarkup(<StatusMessage tone={tone}>{banner.mock}</StatusMessage>);
    expect(html).toContain(`class="status status-${tone}" role="status"`);
  });

  it.each(["warning", "error"] as const)("%s uses role=alert", (tone) => {
    const html = renderToStaticMarkup(<StatusMessage tone={tone}>{banner.mock}</StatusMessage>);
    expect(html).toContain(`class="status status-${tone}" role="alert"`);
    expect(html).not.toContain("aria-live");
  });

  it("defaults to the info tone", () => {
    expect(renderToStaticMarkup(<StatusMessage>x</StatusMessage>)).toContain('class="status status-info" role="status"');
  });

  it("renders a hidden icon, title, body and action", () => {
    const html = renderToStaticMarkup(
      <StatusMessage tone="error" title={banner.noKeyTitle} action={<button type="button">다시 시도</button>} className="extra" data-testid="msg">
        {banner.noKeyBody}
      </StatusMessage>,
    );
    expect(html).toContain('class="status status-error extra" role="alert" data-testid="msg"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain(`<div class="status-title">${banner.noKeyTitle}</div>`);
    expect(html).toContain(`<div>${banner.noKeyBody}</div>`);
    expect(html).toContain('<button type="button">다시 시도</button></div></div>');
  });

  it("omits title and body wrappers when not given", () => {
    const html = renderToStaticMarkup(<StatusMessage tone="success" />);
    expect(html).not.toContain("status-title");
    expect(html).toContain('<div class="status-body"></div>');
  });
});
