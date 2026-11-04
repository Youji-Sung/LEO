import Anthropic from "@anthropic-ai/sdk";
import { afterEach, describe, expect, it } from "vitest";
import { AnthropicProvider } from "@/services/claude/anthropic-provider";
import { classifyClaudeError } from "@/services/claude/errors";
import { ClaudeConfigError } from "@/services/claude/types";
import { errors } from "@/content/ko";

const savedKey = process.env.LEO_ANTHROPIC_API_KEY;
afterEach(() => {
  if (savedKey === undefined) delete process.env.LEO_ANTHROPIC_API_KEY;
  else process.env.LEO_ANTHROPIC_API_KEY = savedKey;
});

describe("classifyClaudeError", () => {
  it("maps config, auth, rate limit, network and generic API errors to Korean messages", () => {
    expect(classifyClaudeError(new ClaudeConfigError("x"))).toEqual({ kind: "no_api_key", message: errors.claude.noKey });
    const headers = new Headers();
    expect(classifyClaudeError(new Anthropic.AuthenticationError(401, undefined, "bad key", headers))).toEqual({
      kind: "bad_api_key",
      message: errors.claude.badKey,
    });
    expect(classifyClaudeError(new Anthropic.RateLimitError(429, undefined, "slow down", headers))).toEqual({
      kind: "rate_limit",
      message: errors.claude.rateLimit,
    });
    expect(classifyClaudeError(new Anthropic.APIConnectionError({ message: "down" }))).toEqual({
      kind: "network",
      message: errors.claude.connection,
    });
    expect(classifyClaudeError(new Anthropic.APIConnectionTimeoutError())).toEqual({ kind: "network", message: errors.claude.timeout });
    expect(classifyClaudeError(new Anthropic.InternalServerError(500, undefined, "boom", headers))).toEqual({
      kind: "api",
      message: errors.claude.api,
    });
    // 내부 값(HTTP 상태)은 사용자 문구에 넣지 않는다.
    expect(classifyClaudeError(new Anthropic.InternalServerError(500, undefined, "boom", headers)).message).not.toContain("500");
    expect(classifyClaudeError(new Error("fetch failed"))).toEqual({ kind: "network", message: errors.claude.network });
    expect(classifyClaudeError(new Error("???"))).toEqual({ kind: "unknown", message: errors.claude.unknown });
  });
});

describe("AnthropicProvider without a key", () => {
  it("fails fast with ClaudeConfigError and never touches the network", async () => {
    delete process.env.LEO_ANTHROPIC_API_KEY;
    const provider = new AnthropicProvider("claude-opus-5");
    await expect(provider.chatTurn({ theme: "free", mode: "chat", hints: false, messages: [{ role: "user", content: "hi" }] }, () => undefined)).rejects.toBeInstanceOf(
      ClaudeConfigError,
    );
    await expect(provider.generateReport({ theme: "free", mode: "chat", transcript: [{ role: "user", content: "hi" }] })).rejects.toBeInstanceOf(ClaudeConfigError);
  });
});
