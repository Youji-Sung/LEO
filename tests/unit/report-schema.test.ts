import { describe, expect, it } from "vitest";
import { buildMockReport } from "@/services/claude/mock-provider";
import { canonical, dedupeCorrections, normalizeReport, parseReportJson } from "@/services/claude/schemas/report";

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

  it("drops trivial and duplicated corrections (외부 피드백 6)", () => {
    expect(canonical("  I'm  a Developer! ")).toBe("i'm a developer");
    expect(canonical("I’m here.")).toBe("i'm here");
    const items = [
      { original: "i go to school yesterday", corrected: "I went to school yesterday.", explanation: "e" },
      { original: "I go to school yesterday.", corrected: "I went to school.", explanation: "dup" },
      { original: "I am a developer", corrected: "I am a developer.", explanation: "punctuation only" },
      { original: "there was very much people", corrected: "There were a lot of people.", explanation: "e" },
      { original: "   ", corrected: "x", explanation: "empty" },
    ];
    const kept = dedupeCorrections(items, (c) => c.corrected);
    expect(kept.map((c) => c.explanation)).toEqual(["e", "e"]);

    const base = buildMockReport({ theme: "free", mode: "chat", transcript: [] });
    const n = normalizeReport({
      ...base,
      grammarCorrections: items,
      vocabularySuggestions: [
        { original: "very good", better: "Very good", meaning: "m", example: "x" },
        { original: "very good", better: "excellent", meaning: "m", example: "x" },
        { original: "make a decision fast", better: "make a quick call", meaning: "m", example: "x" },
      ],
      betterExpressions: [
        { original: "I like it.", native: "I like it" },
        { original: "I like it.", native: "I'm really into it." },
        { original: "It is good.", native: "It's great." },
      ],
    });
    expect(n.grammarCorrections).toHaveLength(2);
    // 사소한 항목은 빠지되 같은 원문의 진짜 제안은 남는다
    expect(n.vocabularySuggestions.map((v) => v.better)).toEqual(["excellent", "make a quick call"]);
    expect(n.betterExpressions.map((b) => b.native)).toEqual(["I'm really into it.", "It's great."]);
    // 모의 리포트의 세 교정은 서로 다른 원문이라 그대로 남는다
    expect(normalizeReport(base).grammarCorrections).toHaveLength(3);
  });

  it("round-trips the mock report through JSON", () => {
    const r = buildMockReport({ theme: "portfolio", mode: "call", transcript: [{ role: "user", content: "hi" }] });
    const parsed = parseReportJson(JSON.stringify(r));
    expect(parsed.error).toBeNull();
    expect(parsed.report?.technicalClarity?.score).toBe(6);
  });
});
