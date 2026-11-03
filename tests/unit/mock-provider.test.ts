import { describe, expect, it } from "vitest";
import { MockClaudeProvider, MOCK_TRIGGERS } from "@/services/claude/mock-provider";
import { reportSchema } from "@/services/claude/schemas/report";

const provider = new MockClaudeProvider(0);

describe("MockClaudeProvider.chatTurn", () => {
  it("streams text deltas that assemble to the final text, with a hint", async () => {
    const deltas: string[] = [];
    const r = await provider.chatTurn(
      { theme: "free", mode: "chat", hints: true, messages: [{ role: "user", content: "I go to school yesterday." }] },
      (t) => deltas.push(t),
    );
    expect(r.stopReason).toBe("end_turn");
    expect(deltas.length).toBeGreaterThan(3);
    expect(deltas.join("").trim()).toBe(r.text);
    expect(r.text).not.toContain("[HINT]");
    expect(r.hint).toContain("went");
    expect(r.usage.outputTokens).toBeGreaterThan(0);
  });

  it("returns no hint when hints are off", async () => {
    const r = await provider.chatTurn({ theme: "work", mode: "call", hints: false, messages: [{ role: "user", content: "Hi" }] }, () => undefined);
    expect(r.hint).toBeNull();
    expect(r.text.length).toBeGreaterThan(10);
  });

  it("simulates a refusal", async () => {
    const r = await provider.chatTurn(
      { theme: "free", mode: "chat", hints: true, messages: [{ role: "user", content: `x ${MOCK_TRIGGERS.refusal}` }] },
      () => undefined,
    );
    expect(r.stopReason).toBe("refusal");
    expect(r.text).toBe("");
  });

  it("simulates an API error", async () => {
    await expect(
      provider.chatTurn({ theme: "free", mode: "chat", hints: false, messages: [{ role: "user", content: MOCK_TRIGGERS.error }] }, () => undefined),
    ).rejects.toThrow();
  });
});

describe("MockClaudeProvider.generateReport", () => {
  const transcript = [
    { role: "assistant" as const, content: "Tell me about yourself." },
    { role: "user" as const, content: "I go to school yesterday." },
    { role: "assistant" as const, content: "And?" },
    { role: "user" as const, content: "There was very much people." },
  ];

  it("produces a report that passes the schema, with interview items for interview themes", async () => {
    const r = await provider.generateReport({ theme: "interview", mode: "call", transcript });
    expect(r.parseError).toBeNull();
    expect(r.report).not.toBeNull();
    expect(reportSchema.safeParse(r.report).success).toBe(true);
    expect(r.report!.interview?.followUpQuestions).toHaveLength(3);
    expect(r.report!.nextTasks).toHaveLength(3);
    expect(r.report!.betterExpressions).toHaveLength(3);
    expect(r.report!.technicalClarity).toBeNull();
  });

  it("omits interview items for non-interview themes and adds technicalClarity for portfolio", async () => {
    const daily = await provider.generateReport({ theme: "daily", mode: "chat", transcript });
    expect(daily.report!.interview).toBeNull();
    const pf = await provider.generateReport({ theme: "portfolio", mode: "call", transcript, portfolioText: "My project" });
    expect(pf.report!.interview).not.toBeNull();
    expect(pf.report!.technicalClarity?.score).toBeGreaterThanOrEqual(1);
  });

  it("reports a schema failure when triggered", async () => {
    const r = await provider.generateReport({
      theme: "free",
      mode: "chat",
      transcript: [{ role: "user", content: `hello ${MOCK_TRIGGERS.invalidReport}` }],
    });
    expect(r.report).toBeNull();
    expect(r.parseError).toContain("스키마");
  });
});
