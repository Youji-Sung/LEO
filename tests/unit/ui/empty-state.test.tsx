import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EmptyState } from "@/components/ui/EmptyState";
import { home } from "@/content/ko";

describe("EmptyState", () => {
  it("renders an h2 title, body, action and data-testid", () => {
    const html = renderToStaticMarkup(
      <EmptyState title={home.recentTitle} body={home.recentEmpty} action={<button type="button">{home.startCall}</button>} data-testid="empty-recent" />,
    );
    expect(html).toMatch(/^<div class="empty" data-testid="empty-recent">/);
    expect(html).toContain(`<h2 class="t-title">${home.recentTitle}</h2>`);
    expect(html).toContain(`<p>${home.recentEmpty}</p>`);
    expect(html).toContain(`<button type="button">${home.startCall}</button></div>`);
  });

  it("hides the icon from assistive tech and skips optional parts", () => {
    const html = renderToStaticMarkup(<EmptyState title="없어요" icon={<i data-i="ic" />} />);
    expect(html).toBe('<div class="empty"><span aria-hidden="true"><i data-i="ic"></i></span><h2 class="t-title">없어요</h2></div>');
  });
});
