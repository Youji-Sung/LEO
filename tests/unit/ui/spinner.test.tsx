import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Skeleton, Spinner } from "@/components/ui/Spinner";
import { common } from "@/content/ko";

describe("Spinner", () => {
  it("renders a status region with a hidden spinner and the label text", () => {
    const html = renderToStaticMarkup(<Spinner label={common.loading} />);
    expect(html).toContain('class="inline-status" role="status"');
    expect(html).toContain('class="spinner" aria-hidden="true"');
    expect(html).toContain(`<span>${common.loading}</span>`);
  });

  it("applies size classes", () => {
    expect(renderToStaticMarkup(<Spinner size="sm" label="x" />)).toContain('class="spinner spinner-sm"');
    expect(renderToStaticMarkup(<Spinner size="lg" label="x" />)).toContain('class="spinner spinner-lg"');
  });

  it("renders only an aria-hidden span when inline", () => {
    const html = renderToStaticMarkup(<Spinner inline label={common.loading} />);
    expect(html).toBe('<span class="spinner" aria-hidden="true"></span>');
    expect(html).not.toContain("role=");
  });

  it("omits the label span when the label is empty", () => {
    const html = renderToStaticMarkup(<Spinner label="" />);
    expect(html).toContain('role="status"');
    expect(html).not.toContain("<span></span>");
  });
});

describe("Skeleton", () => {
  it("is hidden from assistive tech and renders `lines` placeholders", () => {
    const html = renderToStaticMarkup(<Skeleton lines={4} />);
    expect(html).toMatch(/^<div aria-hidden="true" class="stack-sm">/);
    expect((html.match(/class="skeleton"/g) ?? []).length).toBe(4);
  });

  it("defaults to 3 lines, with the last line shorter", () => {
    const html = renderToStaticMarkup(<Skeleton />);
    expect((html.match(/class="skeleton"/g) ?? []).length).toBe(3);
    expect((html.match(/width:100%/g) ?? []).length).toBe(2);
    expect(html).toContain("width:60%");
  });

  it("applies height and a fixed width to every line", () => {
    const html = renderToStaticMarkup(<Skeleton lines={2} height="2em" width="50%" />);
    expect((html.match(/height:2em;width:50%/g) ?? []).length).toBe(2);
  });
});
