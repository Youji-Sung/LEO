import Anthropic from "@anthropic-ai/sdk";
import { ClaudeConfigError } from "@/services/claude/types";
import { errors } from "@/content/ko";

export type ClaudeErrorKind = "no_api_key" | "bad_api_key" | "rate_limit" | "network" | "api" | "unknown";

// Claude 호출 실패를 사용자 안내 문구로 바꾼다. SDK 오류 클래스는 여기서만 본다.
// HTTP 상태 같은 내부 값은 문구에 넣지 않는다(WRITING.md). 원인은 호출자가 console.error 로 남긴다.
export function classifyClaudeError(e: unknown): { kind: ClaudeErrorKind; message: string } {
  if (e instanceof ClaudeConfigError) {
    return { kind: "no_api_key", message: errors.claude.noKey };
  }
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
    return { kind: "bad_api_key", message: errors.claude.badKey };
  }
  if (e instanceof Anthropic.RateLimitError) {
    return { kind: "rate_limit", message: errors.claude.rateLimit };
  }
  if (e instanceof Anthropic.APIConnectionTimeoutError) {
    return { kind: "network", message: errors.claude.timeout };
  }
  if (e instanceof Anthropic.APIConnectionError) {
    return { kind: "network", message: errors.claude.connection };
  }
  if (e instanceof Anthropic.APIError) {
    return { kind: "api", message: errors.claude.api };
  }
  const msg = e instanceof Error ? e.message : String(e);
  if (/ECONNREFUSED|ENOTFOUND|ECONNRESET|fetch failed|network/i.test(msg)) {
    return { kind: "network", message: errors.claude.network };
  }
  return { kind: "unknown", message: errors.claude.unknown };
}

export function describeClaudeError(e: unknown): string {
  return classifyClaudeError(e).message;
}
