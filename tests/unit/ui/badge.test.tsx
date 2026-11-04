import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Badge } from "@/components/ui/Badge";
import { common } from "@/content/ko";

describe("Badge", () => {
  it("renders neutral text with only the base class", () => {
    expect(renderToStaticMarkup(<Badge>{common.ended}</Badge>)).toBe(`<span class="badge">${common.ended}</span>`);
  });

  it.each(["accent", "positive", "caution", "negative"] as const)("adds the %s tone class", (tone) => {
    const html = renderToStaticMarkup(<Badge tone={tone}>{common.inProgress}</Badge>);
    expect(html).toContain(`class="badge badge-${tone}"`);
    expect(html).toContain(common.inProgress);
  });

  it("hides the icon from assistive tech and keeps the text", () => {
    const html = renderToStaticMarkup(
      <Badge tone="positive" icon={<i data-i="ok" />}>
        {common.hasReport}
      </Badge>,
    );
    expect(html).toBe(`<span class="badge badge-positive"><span aria-hidden="true"><i data-i="ok"></i></span>${common.hasReport}</span>`);
  });
});
