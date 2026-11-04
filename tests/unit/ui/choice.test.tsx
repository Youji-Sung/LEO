import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CheckRow, Choice, ChoiceGroup } from "@/components/ui/Choice";
import { settings, themes } from "@/content/ko";

describe("ChoiceGroup", () => {
  it("renders a fieldset with a visible legend and its children", () => {
    const html = renderToStaticMarkup(
      <ChoiceGroup legend={themes.legend}>
        <span data-i="child" />
      </ChoiceGroup>,
    );
    expect(html).toContain('<fieldset class="field">');
    expect(html).toContain(`<legend>${themes.legend}</legend>`);
    expect(html).toContain('<div class="choice-list"><span data-i="child"></span></div>');
  });

  it("hides the legend with sr-only, shows a hint, stacks and takes a class", () => {
    const html = renderToStaticMarkup(
      <ChoiceGroup legend={themes.legend} hideLegend hint={settings.themeHint} stack className="extra">
        x
      </ChoiceGroup>,
    );
    expect(html).toContain('<fieldset class="field extra">');
    expect(html).toContain(`<legend class="sr-only">${themes.legend}</legend>`);
    expect(html).toContain(`<span class="field-hint">${settings.themeHint}</span>`);
    expect(html).toContain('class="choice-list choice-list-stack"');
  });
});

describe("Choice", () => {
  it("renders a radio by default with name/value/checked and the title", () => {
    const html = renderToStaticMarkup(<Choice title="10분" name="minutes" value="10" checked readOnly />);
    expect(html).toContain('<label class="choice" data-kind="radio">');
    expect(html).toMatch(/<input type="radio" [^>]*name="minutes"[^>]*>/);
    expect(html).toMatch(/<input type="radio" [^>]*checked=""[^>]*>/);
    expect(html).toMatch(/<input type="radio" [^>]*value="10"[^>]*>/);
    expect(html).toContain('<span class="choice-mark" aria-hidden="true"></span>');
    expect(html).toContain('<span class="choice-title">10분</span>');
    expect(html).not.toContain("choice-desc");
  });

  it("renders a checkbox with description, icon and compact class", () => {
    const html = renderToStaticMarkup(<Choice kind="checkbox" title="제목" description="설명" compact icon={<i data-i="ic" />} name="k" value="v" />);
    expect(html).toContain('<label class="choice choice-compact" data-kind="checkbox">');
    expect(html).toContain('<input type="checkbox" name="k" value="v"');
    expect(html).not.toContain('checked=""');
    expect(html).toContain('<span class="choice-icon"><i data-i="ic"></i></span>제목');
    expect(html).toContain('<span class="choice-desc">설명</span>');
  });
});

describe("CheckRow", () => {
  it("renders a checkbox inside a label with the text and an optional hint", () => {
    const html = renderToStaticMarkup(<CheckRow label={settings.hintsDefault} hint={settings.hintsDefaultHint} name="hints" defaultChecked />);
    expect(html).toContain('<div class="field"><label class="check-row">');
    expect(html).toContain('<input type="checkbox" name="hints" checked=""');
    expect(html).toContain(`<span>${settings.hintsDefault}</span></label>`);
    expect(html).toContain(`<span class="field-hint">${settings.hintsDefaultHint}</span>`);
  });

  it("omits the hint when none is given", () => {
    expect(renderToStaticMarkup(<CheckRow label="x" />)).not.toContain("field-hint");
  });
});
