import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Card } from "@/components/ui/Card";

describe("Card", () => {
  it("renders a plain div with md padding by default", () => {
    const html = renderToStaticMarkup(<Card>내용</Card>);
    expect(html).toBe('<div class="card">내용</div>');
  });

  it("renders the element given by `as`", () => {
    const html = renderToStaticMarkup(<Card as="section">내용</Card>);
    expect(html).toBe('<section class="card">내용</section>');
  });

  it("renders the title as an h2 and wires aria-labelledby when titleId is given", () => {
    const html = renderToStaticMarkup(
      <Card as="section" title="최근 대화" titleId="recent">
        내용
      </Card>,
    );
    expect(html).toContain('<section class="card" aria-labelledby="recent">');
    expect(html).toContain('<h2 class="card-title" id="recent">최근 대화</h2>');
  });

  it("does not add aria-labelledby without a titleId", () => {
    const html = renderToStaticMarkup(<Card title="제목">내용</Card>);
    expect(html).toContain('<h2 class="card-title">제목</h2>');
    expect(html).not.toContain("aria-labelledby");
  });

  it("applies the sm padding class, extra className and passthrough attributes", () => {
    const html = renderToStaticMarkup(
      <Card padding="sm" className="extra" data-testid="c">
        내용
      </Card>,
    );
    expect(html).toContain('class="card card-sm extra"');
    expect(html).toContain('data-testid="c"');
  });
});
