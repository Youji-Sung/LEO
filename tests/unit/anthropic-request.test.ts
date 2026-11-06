import { afterEach, describe, expect, it, vi } from "vitest";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { AnthropicProvider } from "@/services/claude/anthropic-provider";
import { buildChatSystemPrompt, buildPortfolioBlock, REPORT_SYSTEM_PROMPT } from "@/services/claude/prompts/themes";
import { buildMockReport } from "@/services/claude/mock-provider";
import { reportSchema } from "@/services/claude/schemas/report";
import type { ChatMessage, ConversationMode, ReportInput } from "@/services/claude/types";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

// 실제 SDK의 요청 직렬화와 스트리밍 처리를 거치되 네트워크는 메모리 응답으로 대체한다.
function mockApi(text: string) {
  vi.stubEnv("LEO_ANTHROPIC_API_KEY", "test-key-never-sent");
  const payloads: Record<string, unknown>[] = [];
  const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(url, init);
    payloads.push(JSON.parse(await request.text()) as Record<string, unknown>);
    const events = [
      {
        type: "message_start",
        message: {
          id: "msg_test", type: "message", role: "assistant", model: "claude-opus-5",
          content: [], stop_reason: null, stop_sequence: null,
          usage: { input_tokens: 20, output_tokens: 0, cache_read_input_tokens: 800, cache_creation_input_tokens: 100 },
        },
      },
      { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
      { type: "content_block_delta", index: 0, delta: { type: "text_delta", text } },
      { type: "content_block_stop", index: 0 },
      { type: "message_delta", delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 65 } },
      { type: "message_stop" },
    ];
    return new Response(events.map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(""), {
      headers: { "Content-Type": "text/event-stream" },
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { payloads, fetchMock };
}

describe("Anthropic request quality contract", () => {
  it.each([
    ["chat", false], ["chat", true], ["call", false], ["call", true],
  ] as const)("caches full %s history without changing content or generation settings (hints=%s)", async (mode: ConversationMode, hints: boolean) => {
    const { payloads, fetchMock } = mockApi("That sounds interesting. What happened next?\n[HINT] go → went · 과거형이에요");
    const messages: ChatMessage[] = Array.from({ length: 119 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `Turn ${i}: keep every detail, whitespace  and 한국어.\nSecond line.`,
    }));
    const original = structuredClone(messages);
    const portfolioText = "Full portfolio\n" + "Architecture, measurements, trade-offs. ".repeat(200);
    const deltas: string[] = [];
    const result = await new AnthropicProvider("claude-opus-5").chatTurn(
      { theme: "portfolio", mode, hints, portfolioText, messages },
      (delta) => deltas.push(delta),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const payload = payloads[0]!;
    expect(payload.cache_control).toEqual({ type: "ephemeral" });
    expect(payload.messages).toEqual(original);
    expect(messages).toEqual(original);
    expect(payload.system).toEqual([
      { type: "text", text: buildChatSystemPrompt("portfolio", mode, hints), cache_control: { type: "ephemeral" } },
      { type: "text", text: buildPortfolioBlock(portfolioText), cache_control: { type: "ephemeral" } },
    ]);
    expect(payload).toMatchObject({
      model: "claude-opus-5", max_tokens: 2048, thinking: { type: "adaptive" },
      output_config: { effort: "low" }, fallbacks: "default", stream: true,
    });
    expect(deltas.join("").trimEnd()).toBe(result.text);
    expect(result.hint).toContain("went");
    expect(result.usage).toEqual({ inputTokens: 20, outputTokens: 65, cacheReadTokens: 800, cacheWriteTokens: 100 });
  });

  it("keeps full report evidence, high effort, schema and output budget", async () => {
    const input: ReportInput = {
      theme: "portfolio", mode: "call", portfolioText: "Architecture and exact project metrics.",
      transcript: [
        { role: "assistant", content: "What did you build?" },
        { role: "user", content: "I build a distributed queue." },
      ],
    };
    const report = buildMockReport(input);
    const { payloads } = mockApi(JSON.stringify(report));
    const result = await new AnthropicProvider("claude-opus-5").generateReport(input);
    const format = betaZodOutputFormat(reportSchema);
    expect(payloads[0]).toMatchObject({
      model: "claude-opus-5", max_tokens: 16000, thinking: { type: "adaptive" },
      output_config: { effort: "high", format: { type: format.type, schema: format.schema } },
      system: [{ type: "text", text: REPORT_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      fallbacks: "default", stream: true,
    });
    const message = (payloads[0]!.messages as Array<{ content: string }>)[0]!.content;
    expect(message).toContain(input.portfolioText);
    for (const entry of input.transcript) expect(message).toContain(entry.content);
    expect(result.parseError).toBeNull();
    expect(result.report?.scores).toEqual(report.scores);
    expect(result.report?.nextTasks).toEqual(report.nextTasks);
    expect(result.report?.interview).toEqual(report.interview);
  });
});
