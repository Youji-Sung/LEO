import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReportView } from "@/components/report/ReportView";
import { report as reportText } from "@/content/ko";
import { buildMockReport } from "@/services/claude/mock-provider";

// 단어 diff 가 바뀐 단어를 span 으로 감싸므로 문장 비교는 태그를 벗기고 한다.
const unescape = (html: string) =>
  html
    .replace(/<span class="diff-word[^"]*">([^<]*)<\/span>/g, "$1")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");

const transcript = [
  { role: "user" as const, content: "I go to school yesterday." },
  { role: "user" as const, content: "There was very much people." },
  { role: "user" as const, content: "I am agree with you." },
];

describe("ReportView", () => {
  it("renders every SPEC 2.3 section for an interview report", () => {
    const report = buildMockReport({ theme: "interview", mode: "call", transcript });
    const html = unescape(
      renderToStaticMarkup(<ReportView report={report} isInterview kind="call" />),
    );
    for (const heading of Object.values(reportText.sections)) {
      expect(html).toContain(heading);
    }
    expect(html).toContain(report.summary);
    const sl = reportText.scoreLabels;
    for (const label of [sl.grammar, sl.vocabulary, sl.fluency, sl.task])
      expect(html).toContain(`${label} `);
    expect((html.match(/data-testid="score"/g) ?? []).length).toBe(4);
    for (const c of report.grammarCorrections) {
      expect(html).toContain(c.original);
      expect(html).toContain(c.corrected);
      expect(html).toContain(c.explanation);
    }
    expect((html.match(/class="correction"/g) ?? []).length).toBe(report.grammarCorrections.length);
    for (const v of report.vocabularySuggestions) expect(html).toContain(v.better);
    for (const b of report.betterExpressions) expect(html).toContain(b.native);
    for (const t of report.nextTasks) expect(html).toContain(t);
    for (const q of report.interview!.followUpQuestions) expect(html).toContain(q);
    expect(html).toContain('data-testid="interview-section"');
  });

  it("orders sections 요약 → 점수 → 면접 → 교정 → 제안 → 표현 → 과제 with a table of contents", () => {
    const report = buildMockReport({ theme: "interview", mode: "call", transcript });
    const html = renderToStaticMarkup(<ReportView report={report} isInterview kind="call" />);
    const ids = ["summary", "scores", "interview", "grammar", "vocabulary", "better", "tasks"];
    const positions = ids.map((id) =>
      html.indexOf(`<section class="card" aria-labelledby="report-${id}-title" id="${id}"`),
    );
    for (const p of positions) expect(p).toBeGreaterThan(-1);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(html).toContain(`<nav class="report-toc" aria-label="${reportText.toc}">`);
    for (const id of ids) expect(html).toContain(`href="#${id}"`);
    expect(html).toContain(`id="report-summary-title">${reportText.sections.summary}</h2>`);
  });

  it("uses labeled diff rows instead of strikethrough or arrows", () => {
    const report = buildMockReport({ theme: "daily", mode: "chat", transcript });
    const html = renderToStaticMarkup(
      <ReportView report={report} isInterview={false} kind="chat" />,
    );
    expect(html).toContain(`<span class="diff-label">${reportText.original}</span>`);
    expect(html).toContain(`<span class="diff-label">${reportText.corrected}</span>`);
    expect(html).not.toContain("→");
    expect(html).not.toContain("<del");
    expect(html).not.toContain("<s>");
  });

  it("ends with one primary next action that matches the conversation kind", () => {
    const report = buildMockReport({ theme: "daily", mode: "chat", transcript });
    const call = renderToStaticMarkup(
      <ReportView report={report} isInterview={false} kind="call" />,
    );
    expect(call).toContain(`class="btn btn-primary" href="/call">${reportText.nextAction}</a>`);
    expect(call).not.toContain(reportText.nextActionChat);
    const chat = renderToStaticMarkup(
      <ReportView report={report} isInterview={false} kind="chat" />,
    );
    expect(chat).toContain(`class="btn btn-primary" href="/chat">${reportText.nextActionChat}</a>`);
    expect(chat).not.toContain(reportText.nextAction);
    expect((chat.match(/btn-primary/g) ?? []).length).toBe(1);
  });

  it("hides interview items for non-interview themes and shows technical clarity for portfolio", () => {
    const daily = buildMockReport({ theme: "daily", mode: "chat", transcript });
    const html = renderToStaticMarkup(
      <ReportView report={daily} isInterview={false} kind="chat" />,
    );
    expect(html).not.toContain(reportText.sections.interview);
    expect(html).not.toContain('href="#interview"');
    expect(html).not.toContain(reportText.scoreLabels.technicalClarity);

    const pf = buildMockReport({
      theme: "portfolio",
      mode: "call",
      transcript,
      portfolioText: "x",
    });
    const pfHtml = renderToStaticMarkup(<ReportView report={pf} isInterview kind="call" />);
    expect(pfHtml).toContain(reportText.scoreLabels.technicalClarity);
    expect((pfHtml.match(/data-testid="score"/g) ?? []).length).toBe(5);
  });
});
