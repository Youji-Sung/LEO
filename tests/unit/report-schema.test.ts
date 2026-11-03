import { describe, expect, it } from "vitest";
import { buildMockReport } from "@/services/claude/mock-provider";
import { normalizeReport, parseReportJson } from "@/services/claude/schemas/report";

describe("report schema", () => {
  it("rejects invalid JSON and wrong shapes", () => {
    expect(parseReportJson("{not json").error).toContain("JSON");
    expect(parseReportJson(JSON.stringify({ summary: "x" })).error).toContain("스키마");
  });

  it("normalizes score ranges and list lengths", () => {
    const base = buildMockReport({ theme: "interview", mode: "chat", transcript: [] });
    const messy = {
      ...base,
      scores: { ...base.scores, grammar: { score: 14.6, comment: "c" }, task: { score: -3, comment: "c" } },
      grammarCorrections: Array.from({ length: 15 }, (_, i) => ({ original: `o${i}`, corrected: "c", explanation: "e" })),
      nextTasks: ["a", "b", "c", "d", "e"],
    };
    const n = normalizeReport(messy);
    expect(n.scores.grammar.score).toBe(10);
    expect(n.scores.task.score).toBe(1);
    expect(n.grammarCorrections).toHaveLength(10);
    expect(n.nextTasks).toHaveLength(3);
  });

  it("round-trips the mock report through JSON", () => {
    const r = buildMockReport({ theme: "portfolio", mode: "call", transcript: [{ role: "user", content: "hi" }] });
    const parsed = parseReportJson(JSON.stringify(r));
    expect(parsed.error).toBeNull();
    expect(parsed.report?.technicalClarity?.score).toBe(6);
  });
});
