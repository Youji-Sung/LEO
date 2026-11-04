import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Bubble } from "@/components/ui/Bubble";
import { common } from "@/content/ko";

describe("Bubble", () => {
  it("renders my bubble with a sr-only speaker label and lang=en text", () => {
    const html = renderToStaticMarkup(
      <Bubble speaker="me" data-testid="msg">
        Hello there.
      </Bubble>,
    );
    expect(html).toMatch(/^<div class="bubble-group bubble-group-me">/);
    expect(html).toContain('<div class="bubble bubble-me" data-testid="msg">');
    expect(html).toContain(`<span class="sr-only">${common.me}: </span><span lang="en">Hello there.</span>`);
    expect(html).not.toContain("bubble-hint");
  });

  it("renders the partner bubble with the partner label", () => {
    const html = renderToStaticMarkup(<Bubble speaker="partner">Hi!</Bubble>);
    expect(html).toContain('class="bubble-group bubble-group-partner"');
    expect(html).toContain('class="bubble bubble-partner"');
    expect(html).toContain(`<span class="sr-only">${common.partner}: </span>`);
  });

  it("marks interim text with a class and includes the interim label in the speaker label", () => {
    const html = renderToStaticMarkup(
      <Bubble speaker="me" interim interimLabel="인식 중">
        Hel
      </Bubble>,
    );
    expect(html).toContain('class="bubble bubble-me bubble-interim"');
    expect(html).toContain(`<span class="sr-only">${common.me} (인식 중): </span>`);
  });

  it("marks a waiting bubble and drops lang=en from its placeholder", () => {
    const html = renderToStaticMarkup(
      <Bubble speaker="partner" waiting>
        ...
      </Bubble>,
    );
    expect(html).toContain('class="bubble bubble-partner bubble-waiting"');
    expect(html).toContain("<span>...</span>");
    expect(html).not.toContain('lang="en"');
  });

  it("renders the hint as a separate block outside the bubble", () => {
    const html = renderToStaticMarkup(
      <Bubble speaker="me" hint="Try: I went to school." hintLabel="교정 힌트">
        I go to school.
      </Bubble>,
    );
    expect(html).toContain('</div><div class="bubble-hint" data-testid="hint">');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('<span><span class="sr-only">교정 힌트: </span>Try: I went to school.</span>');
  });
});
