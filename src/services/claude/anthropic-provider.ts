import Anthropic from "@anthropic-ai/sdk";
import { apiAttemptContext } from "@/lib/api-attempt-context";
import { speechAnnotation } from "@/lib/transcription";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { TokenUsage } from "@/config/pricing";
import { HintSplitter } from "@/services/claude/hint-splitter";
import {
  buildChatSystemPrompt,
  buildPortfolioBlock,
  buildReportUserMessage,
  REPORT_SYSTEM_PROMPT,
  THEMES,
} from "@/services/claude/prompts/themes";
import { parseReportJson, reportSchema } from "@/services/claude/schemas/report";
import {
  ClaudeConfigError,
  type ChatTurnInput,
  type ChatTurnResult,
  type ClaudeProvider,
  type ReportInput,
  type ReportResult,
  type StopReason,
} from "@/services/claude/types";

export const DEFAULT_MODEL = "claude-opus-5";
const FALLBACK_BETA = "server-side-fallback-2026-07-01";
const CHAT_MAX_TOKENS = 2048;
const REPORT_MAX_TOKENS = 16000;

export function resolveModel(): string {
  return process.env.LEO_CLAUDE_MODEL?.trim() || DEFAULT_MODEL;
}

export function createAnthropicClient(): Anthropic {
  const apiKey = process.env.LEO_ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new ClaudeConfigError("LEO_ANTHROPIC_API_KEY 가 설정되지 않았습니다.");
  }
  return new Anthropic({
    apiKey,
    maxRetries: 2,
    timeout: 10 * 60 * 1000,
    fetch: (...args) => {
      const context = apiAttemptContext.getStore();
      if (context) context.attempts++;
      return globalThis.fetch(...args);
    },
  });
}

function toUsage(u: Anthropic.Beta.BetaUsage): TokenUsage {
  return {
    inputTokens: u.input_tokens,
    outputTokens: u.output_tokens,
    cacheReadTokens: u.cache_read_input_tokens ?? 0,
    cacheWriteTokens: u.cache_creation_input_tokens ?? 0,
  };
}

function toStopReason(reason: Anthropic.Beta.BetaMessage["stop_reason"]): StopReason {
  if (reason === "end_turn" || reason === "max_tokens" || reason === "refusal") return reason;
  return "other";
}

function systemBlocks(
  fixed: string,
  portfolioText?: string | null,
): Anthropic.Beta.BetaTextBlockParam[] {
  // 고정 프롬프트가 먼저, 포트폴리오는 그 뒤 고정 위치. 둘 다 캐시 브레이크포인트.
  const blocks: Anthropic.Beta.BetaTextBlockParam[] = [
    { type: "text", text: fixed, cache_control: { type: "ephemeral" } },
  ];
  if (portfolioText) {
    blocks.push({
      type: "text",
      text: buildPortfolioBlock(portfolioText),
      cache_control: { type: "ephemeral" },
    });
  }
  return blocks;
}

export class AnthropicProvider implements ClaudeProvider {
  readonly name = "anthropic";
  private client: Anthropic | null = null;

  constructor(private readonly model: string = resolveModel()) {}

  private getClient(): Anthropic {
    if (!this.client) this.client = createAnthropicClient();
    return this.client;
  }

  async chatTurn(input: ChatTurnInput, onDelta: (text: string) => void): Promise<ChatTurnResult> {
    const started = Date.now();
    const splitter = new HintSplitter(onDelta);
    const stream = this.getClient().beta.messages.stream({
      model: this.model,
      max_tokens: CHAT_MAX_TOKENS,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      // 대화 원문을 유지하면서 이전 턴까지 재사용한다. 시스템 블록의 캐시와 함께 동작한다.
      cache_control: { type: "ephemeral" },
      system: [
        ...systemBlocks(
          buildChatSystemPrompt(input.theme, input.mode, input.hints),
          input.portfolioText,
        ),
        ...(input.conversationContext
          ? [{ type: "text" as const, text: input.conversationContext }]
          : []),
      ],
      messages: input.messages.map((m) => ({ role: m.role, content: m.content })),
    });
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        splitter.push(event.delta.text);
      }
    }
    const final = await stream.finalMessage();
    const stopReason = toStopReason(final.stop_reason);
    const { text, hint } = splitter.finish();
    return {
      text: stopReason === "refusal" ? "" : text,
      hint: stopReason === "refusal" ? null : hint,
      stopReason,
      refusalCategory: final.stop_details?.category ?? null,
      usage: toUsage(final.usage),
      model: final.model,
      latencyMs: Date.now() - started,
    };
  }

  async generateReport(input: ReportInput): Promise<ReportResult> {
    const started = Date.now();
    const theme = THEMES[input.theme];
    const transcript = input.transcript
      .map(
        (m) =>
          `${m.role === "user" ? "User" : "Partner"}: ${m.content}${input.mode === "call" && m.role === "user" ? `\n[Transcription evidence: ${m.speech?.reviewed ? "user reviewed the submitted text" : "not verified by the user"}. ${speechAnnotation(m.content, m.speech)}]` : ""}`,
      )
      .join("\n");
    const stream = this.getClient().beta.messages.stream({
      model: this.model,
      max_tokens: REPORT_MAX_TOKENS,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: { effort: "high", format: betaZodOutputFormat(reportSchema) },
      system: [{ type: "text", text: REPORT_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: buildReportUserMessage({
            themeLabel: theme.label,
            isInterview: theme.isInterview,
            isPortfolio: input.theme === "portfolio",
            mode: input.mode,
            transcript,
            portfolioText: input.portfolioText,
          }),
        },
      ],
    });
    const final = await stream.finalMessage();
    const stopReason = toStopReason(final.stop_reason);
    const rawText = final.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const parsed =
      stopReason === "refusal"
        ? { report: null, error: "모델이 요청을 거부했습니다." }
        : parseReportJson(rawText);
    return {
      report: parsed.report,
      rawText,
      parseError: parsed.error,
      stopReason,
      refusalCategory: final.stop_details?.category ?? null,
      usage: toUsage(final.usage),
      model: final.model,
      latencyMs: Date.now() - started,
    };
  }
}
