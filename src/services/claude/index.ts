import { AnthropicProvider } from "@/services/claude/anthropic-provider";
import { MockClaudeProvider } from "@/services/claude/mock-provider";
import type { ClaudeProvider } from "@/services/claude/types";

export type { ClaudeProvider } from "@/services/claude/types";
export { ClaudeConfigError } from "@/services/claude/types";

let cached: ClaudeProvider | null = null;

export function isMockMode(): boolean {
  return process.env.CLAUDE_MOCK === "1";
}

export function hasApiKey(): boolean {
  return Boolean(process.env.LEO_ANTHROPIC_API_KEY?.trim());
}

// Claude 호출은 이 provider 를 통해서만 한다. CLAUDE_MOCK=1 이면 SDK 를 전혀 건드리지 않는다.
export function getClaudeProvider(): ClaudeProvider {
  if (cached) return cached;
  cached = isMockMode() ? new MockClaudeProvider() : new AnthropicProvider();
  return cached;
}

export function resetClaudeProviderForTests(): void {
  cached = null;
}
