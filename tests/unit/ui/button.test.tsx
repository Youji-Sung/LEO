import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button, ButtonLink } from "@/components/ui/Button";

describe("Button", () => {
  it("defaults to type=button and the secondary variant", () => {
    const html = renderToStaticMarkup(<Button>저장</Button>);
    expect(html).toContain('type="button"');
    expect(html).toContain('class="btn btn-secondary"');
    expect(html).toContain(">저장</button>");
    expect(html).not.toContain("aria-busy");
    expect(html).not.toContain("disabled");
  });

  it("keeps an explicit type", () => {
    expect(renderToStaticMarkup(<Button type="submit">보내기</Button>)).toContain('type="submit"');
  });

  it("applies variant, size, block and extra class names", () => {
    const html = renderToStaticMarkup(
      <Button variant="primary" size="lg" block className="extra">
        시작
      </Button>,
    );
    expect(html).toContain('class="btn btn-primary btn-lg btn-block extra"');
    expect(renderToStaticMarkup(<Button variant="danger">삭제</Button>)).toContain("btn-danger");
    expect(renderToStaticMarkup(<Button variant="ghost">닫기</Button>)).toContain("btn-ghost");
  });

  it("renders the icon hidden from assistive tech next to the label", () => {
    const html = renderToStaticMarkup(<Button icon={<i data-i="x" />}>라벨</Button>);
    expect(html).toContain('<span aria-hidden="true"><i data-i="x"></i></span>라벨');
  });

  it("marks loading with aria-busy, disabled and a spinner, and swaps in loadingLabel", () => {
    const html = renderToStaticMarkup(
      <Button loading loadingLabel="저장하는 중">
        저장
      </Button>,
    );
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("disabled");
    expect(html).toContain('class="spinner spinner-sm" aria-hidden="true"');
    expect(html).toContain("저장하는 중</button>");
    expect(html).not.toContain(">저장</button>");
  });

  it("keeps the original label while loading when no loadingLabel is given", () => {
    const html = renderToStaticMarkup(<Button loading>저장</Button>);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("저장</button>");
  });

  it("renders only the icon for iconOnly and requires aria-label", () => {
    const html = renderToStaticMarkup(
      <Button iconOnly aria-label="닫기" icon={<i data-i="x" />}>
        닫기
      </Button>,
    );
    expect(html).toContain("btn-icon-only");
    expect(html).toContain('aria-label="닫기"');
    expect(html).toContain('<span aria-hidden="true"><i data-i="x"></i></span></button>');
    expect(html).not.toContain(">닫기<");
    expect(() => renderToStaticMarkup(<Button iconOnly icon={<i />} />)).toThrow(/aria-label/);
  });
});

describe("ButtonLink", () => {
  it("renders an anchor with href and button classes", () => {
    const html = renderToStaticMarkup(
      <ButtonLink href="/call" variant="primary" size="lg" block data-testid="go">
        통화 시작
      </ButtonLink>,
    );
    expect(html).toMatch(/^<a /);
    expect(html).toContain('href="/call"');
    expect(html).toContain('class="btn btn-primary btn-lg btn-block"');
    expect(html).toContain('data-testid="go"');
    expect(html).toContain("통화 시작</a>");
  });

  it("supports aria-current and iconOnly with aria-label", () => {
    const html = renderToStaticMarkup(<ButtonLink href="/x" aria-current="page" iconOnly aria-label="홈" icon={<i data-i="h" />} />);
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('aria-label="홈"');
    expect(html).toContain("btn-icon-only");
    expect(() => renderToStaticMarkup(<ButtonLink href="/x" iconOnly icon={<i />} />)).toThrow(/aria-label/);
  });
});
