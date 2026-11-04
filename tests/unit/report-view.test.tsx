import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReportView } from "@/components/report/ReportView";
import { report as reportText } from "@/content/ko";
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
    for (const heading of Object.values(reportText.sections)) {
      expect(html).toContain(heading);
    }
    expect(html).toContain(report.summary);
    const sl = reportText.scoreLabels;
    for (const label of [sl.grammar, sl.vocabulary, sl.fluency, sl.task]) expect(html).toContain(`${label} `);
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
    expect(html).not.toContain(reportText.sections.interview);
    expect(html).not.toContain(reportText.scoreLabels.technicalClarity);

    const pf = buildMockReport({ theme: "portfolio", mode: "call", transcript, portfolioText: "x" });
    const pfHtml = renderToStaticMarkup(<ReportView report={pf} isInterview />);
    expect(pfHtml).toContain(reportText.scoreLabels.technicalClarity);
    expect((pfHtml.match(/data-testid="score"/g) ?? []).length).toBe(5);
  });
});
