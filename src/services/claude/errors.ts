import Anthropic from "@anthropic-ai/sdk";
import { ClaudeConfigError } from "@/services/claude/types";

export type ClaudeErrorKind = "no_api_key" | "bad_api_key" | "rate_limit" | "network" | "api" | "unknown";

// Claude 호출 실패를 사용자 안내 문구로 바꾼다. SDK 오류 클래스는 여기서만 본다.
export function classifyClaudeError(e: unknown): { kind: ClaudeErrorKind; message: string } {
  if (e instanceof ClaudeConfigError) {
    return { kind: "no_api_key", message: "Claude API 키가 설정되지 않았습니다. 운영자가 LEO_ANTHROPIC_API_KEY 를 설정해야 합니다." };
  }
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
    return { kind: "bad_api_key", message: "Claude API 키가 올바르지 않거나 권한이 없습니다. 운영자에게 알려 주세요." };
  }
  if (e instanceof Anthropic.RateLimitError) {
    return { kind: "rate_limit", message: "Claude API 사용량 한도에 걸렸습니다. 잠시 후 다시 시도하세요." };
  }
  if (e instanceof Anthropic.APIConnectionTimeoutError) {
    return { kind: "network", message: "Claude API 응답이 너무 늦어 중단했습니다. 다시 시도하세요." };
  }
  if (e instanceof Anthropic.APIConnectionError) {
    return { kind: "network", message: "Claude API 에 연결하지 못했습니다. 네트워크를 확인하고 다시 시도하세요." };
  }
  if (e instanceof Anthropic.APIError) {
    return { kind: "api", message: `Claude API 오류(${e.status ?? "?"})가 발생했습니다. 잠시 후 다시 시도하세요.` };
  }
  const msg = e instanceof Error ? e.message : String(e);
  if (/ECONNREFUSED|ENOTFOUND|ECONNRESET|fetch failed|network/i.test(msg)) {
    return { kind: "network", message: "네트워크 오류가 발생했습니다. 다시 시도하세요." };
  }
  return { kind: "unknown", message: "응답을 받지 못했습니다. 다시 시도하세요." };
}

export function describeClaudeError(e: unknown): string {
  return classifyClaudeError(e).message;
}
