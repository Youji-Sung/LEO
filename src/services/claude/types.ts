import type { TokenUsage } from "@/config/pricing";
import type { Report } from "@/services/claude/schemas/report";

export const THEME_IDS = ["free", "interview", "daily", "work", "business", "portfolio"] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export type ChatRole = "user" | "assistant";
export type ChatMessage = { role: ChatRole; content: string };
export type ConversationMode = "chat" | "call";

export type StopReason = "end_turn" | "max_tokens" | "refusal" | "other";

export type ChatTurnInput = {
  theme: ThemeId;
  mode: ConversationMode;
  messages: ChatMessage[];
  hints: boolean;
  portfolioText?: string | null;
};

export type ChatTurnResult = {
  text: string;
  hint: string | null;
  stopReason: StopReason;
  refusalCategory?: string | null;
  usage: TokenUsage;
  model: string;
  latencyMs: number;
};

export type ReportInput = {
  theme: ThemeId;
  mode: ConversationMode;
  transcript: ChatMessage[];
  portfolioText?: string | null;
};

export type ReportResult = {
  report: Report | null;
  rawText: string;
  parseError: string | null;
  stopReason: StopReason;
  refusalCategory?: string | null;
  usage: TokenUsage;
  model: string;
  latencyMs: number;
};

export interface ClaudeProvider {
  readonly name: string;
  chatTurn(input: ChatTurnInput, onDelta: (text: string) => void): Promise<ChatTurnResult>;
  generateReport(input: ReportInput): Promise<ReportResult>;
}

export class ClaudeConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClaudeConfigError";
  }
}
