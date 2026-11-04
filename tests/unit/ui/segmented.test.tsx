import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Segmented } from "@/components/ui/Segmented";

const links = [
  { id: "all", label: "전체", href: "/history" },
  { id: "call", label: "통화", href: "/history?mode=call" },
  { id: "chat", label: "채팅", href: "/history?mode=chat" },
];

describe("Segmented", () => {
  it("renders a labelled nav with aria-current=page on the selected link", () => {
    const html = renderToStaticMarkup(<Segmented label="기록 필터" items={links} value="call" />);
    expect(html).toMatch(/^<nav class="segmented" aria-label="기록 필터">/);
    expect((html.match(/<a /g) ?? []).length).toBe(3);
    expect(html).toMatch(/<a (aria-current="page" href="\/history\?mode=call"|href="\/history\?mode=call" aria-current="page")>통화<\/a>/);
    expect(html).toContain('<a href="/history">전체</a>');
    expect(html).toContain('<a href="/history?mode=chat">채팅</a>');
    expect((html.match(/aria-current/g) ?? []).length).toBe(1);
    expect(html).not.toContain("tablist");
  });

  it("renders a button group with aria-pressed when items have no href", () => {
    const items = [
      { id: "text", label: "직접 입력" },
      { id: "file", label: "파일 올리기" },
    ];
    const html = renderToStaticMarkup(<Segmented label="입력 방식" items={items} value="file" onChange={() => {}} />);
    expect(html).toMatch(/^<div class="segmented" role="group" aria-label="입력 방식">/);
    expect(html).toContain('<button type="button" aria-pressed="false">직접 입력</button>');
    expect(html).toContain('<button type="button" aria-pressed="true">파일 올리기</button>');
    expect(html).not.toContain("<a ");
  });
});
