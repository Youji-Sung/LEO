import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ThemeSelect } from "@/components/ui/ThemeSelect";
import { settings } from "@/content/ko";
import { THEME_MODES } from "@/lib/theme";

describe("ThemeSelect", () => {
  it("renders a radio group with the theme legend, hint and one option per mode", () => {
    const html = renderToStaticMarkup(<ThemeSelect value="dark" onChange={() => {}} />);
    expect(html).toContain(`<legend>${settings.theme}</legend>`);
    expect(html).toContain(`<span class="field-hint">${settings.themeHint}</span>`);
    expect((html.match(/<input type="radio" name="theme"/g) ?? []).length).toBe(3);
    expect(THEME_MODES).toEqual(["system", "light", "dark"]);
    for (const mode of THEME_MODES) {
      expect(html).toMatch(new RegExp(`<input type="radio" name="theme" [^>]*value="${mode}"`));
      expect(html).toContain(settings.themeOptions[mode]);
    }
  });

  it.each(THEME_MODES)("checks only the %s radio when it is the value", (mode) => {
    const html = renderToStaticMarkup(<ThemeSelect value={mode} onChange={() => {}} />);
    expect(html).toContain(`<input type="radio" name="theme" checked="" value="${mode}"`);
    expect((html.match(/checked=""/g) ?? []).length).toBe(1);
  });

  it("renders compact choice cards with hidden icons", () => {
    const html = renderToStaticMarkup(<ThemeSelect value="system" onChange={() => {}} />);
    expect((html.match(/class="choice choice-compact" data-kind="radio"/g) ?? []).length).toBe(3);
    expect((html.match(/<span class="choice-icon"><svg[^>]*aria-hidden="true"/g) ?? []).length).toBe(3);
  });
});
