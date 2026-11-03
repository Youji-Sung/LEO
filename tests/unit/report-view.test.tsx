import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReportView } from "@/components/report/ReportView";
import { buildMockReport } from "@/services/claude/mock-provider";

const unescape = (html: string) => html.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

const transcript = [
  { role: "user" as const, content: "I go to school yesterday." },
  { role: "user" as const, content: "There was very much people." },
  { role: "user" as const, content: "I am agree with you." },
];

describe("ReportView", () => {
  it("renders every SPEC 2.3 section for an interview report", () => {
    const report = buildMockReport({ theme: "interview", mode: "call", transcript });
    const html = unescape(renderToStaticMarkup(<ReportView report={report} isInterview />));
    for (const heading of ["요약", "종합 점수", "문법 교정", "어휘 제안", "더 나은 표현", "다음 연습 과제", "면접 피드백", "예상 추가 질문"]) {
      expect(html).toContain(heading);
    }
    expect(html).toContain(report.summary);
    for (const label of ["문법", "어휘", "유창성", "과제 수행"]) expect(html).toContain(`${label} `);
    expect((html.match(/data-testid="score"/g) ?? []).length).toBe(4);
    for (const c of report.grammarCorrections) {
      expect(html).toContain(c.original);
      expect(html).toContain(c.corrected);
      expect(html).toContain(c.explanation);
    }
    for (const v of report.vocabularySuggestions) expect(html).toContain(v.better);
    for (const b of report.betterExpressions) expect(html).toContain(b.native);
    for (const t of report.nextTasks) expect(html).toContain(t);
    for (const q of report.interview!.followUpQuestions) expect(html).toContain(q);
  });

  it("hides interview items for non-interview themes and shows technical clarity for portfolio", () => {
    const daily = buildMockReport({ theme: "daily", mode: "chat", transcript });
    const html = renderToStaticMarkup(<ReportView report={daily} isInterview={false} />);
    expect(html).not.toContain("면접 피드백");
    expect(html).not.toContain("기술 설명의 명확성");

    const pf = buildMockReport({ theme: "portfolio", mode: "call", transcript, portfolioText: "x" });
    const pfHtml = renderToStaticMarkup(<ReportView report={pf} isInterview />);
    expect(pfHtml).toContain("기술 설명의 명확성");
    expect((pfHtml.match(/data-testid="score"/g) ?? []).length).toBe(5);
  });
});
