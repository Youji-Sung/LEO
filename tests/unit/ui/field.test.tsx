import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Select, TextArea, TextField } from "@/components/ui/Field";
import { auth } from "@/content/ko";

const cases = [
  {
    name: "TextField",
    tag: "input",
    render: (p: { hideLabel?: boolean; hint?: string; error?: string | null }) => <TextField id="email" label={auth.email} type="email" {...p} />,
  },
  {
    name: "TextArea",
    tag: "textarea",
    render: (p: { hideLabel?: boolean; hint?: string; error?: string | null }) => <TextArea id="email" label={auth.email} rows={3} {...p} />,
  },
  {
    name: "Select",
    tag: "select",
    render: (p: { hideLabel?: boolean; hint?: string; error?: string | null }) => (
      <Select id="email" label={auth.email} {...p}>
        <option value="a">A</option>
      </Select>
    ),
  },
];

describe.each(cases)("$name", ({ tag, render }) => {
  it("links the visible label to the control by id", () => {
    const html = renderToStaticMarkup(render({}));
    expect(html).toContain('class="field"');
    expect(html).toContain(`<label for="email">${auth.email}</label>`);
    expect(html).toContain(`<${tag} id="email"`);
    expect(html).not.toContain("aria-describedby");
    expect(html).not.toContain("aria-invalid");
  });

  it("hides the label visually with sr-only when hideLabel is set", () => {
    const html = renderToStaticMarkup(render({ hideLabel: true }));
    expect(html).toContain(`<label for="email" class="sr-only">${auth.email}</label>`);
  });

  it("describes the control with the hint id", () => {
    const html = renderToStaticMarkup(render({ hint: auth.passwordHint }));
    expect(html).toContain('aria-describedby="email-hint"');
    expect(html).toContain(`<span id="email-hint" class="field-hint">${auth.passwordHint}</span>`);
  });

  it("marks the control invalid and announces the error", () => {
    const html = renderToStaticMarkup(render({ error: "필수 항목이에요." }));
    expect(html).toContain('aria-describedby="email-error"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('<span id="email-error" class="field-error" role="alert">');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("필수 항목이에요.</span>");
  });

  it("lists hint and error ids together", () => {
    const html = renderToStaticMarkup(render({ hint: "힌트", error: "오류" }));
    expect(html).toContain('aria-describedby="email-hint email-error"');
  });
});

describe("Field passthrough", () => {
  it("forwards native attributes", () => {
    expect(renderToStaticMarkup(<TextField id="n" label="x" required autoComplete="name" placeholder="p" />)).toContain('required="" autoComplete="name" placeholder="p"');
    expect(renderToStaticMarkup(<TextArea id="n" label="x" rows={4} />)).toContain('rows="4"');
    expect(
      renderToStaticMarkup(
        <Select id="n" label="x" defaultValue="b">
          <option value="a">A</option>
          <option value="b">B</option>
        </Select>,
      ),
    ).toContain('<option value="b" selected="">B</option>');
  });
});
