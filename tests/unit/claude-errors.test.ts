import Anthropic from "@anthropic-ai/sdk";
import { afterEach, describe, expect, it } from "vitest";
import { AnthropicProvider } from "@/services/claude/anthropic-provider";
import { classifyClaudeError } from "@/services/claude/errors";
import { ClaudeConfigError } from "@/services/claude/types";

const savedKey = process.env.LEO_ANTHROPIC_API_KEY;
afterEach(() => {
  if (savedKey === undefined) delete process.env.LEO_ANTHROPIC_API_KEY;
  else process.env.LEO_ANTHROPIC_API_KEY = savedKey;
});

describe("classifyClaudeError", () => {
  it("maps config, auth, rate limit, network and generic API errors to Korean messages", () => {
    expect(classifyClaudeError(new ClaudeConfigError("x")).kind).toBe("no_api_key");
    expect(classifyClaudeError(new ClaudeConfigError("x")).message).toContain("LEO_ANTHROPIC_API_KEY");
    const headers = new Headers();
    expect(classifyClaudeError(new Anthropic.AuthenticationError(401, undefined, "bad key", headers)).kind).toBe("bad_api_key");
    expect(classifyClaudeError(new Anthropic.RateLimitError(429, undefined, "slow down", headers)).kind).toBe("rate_limit");
    expect(classifyClaudeError(new Anthropic.APIConnectionError({ message: "down" })).kind).toBe("network");
    expect(classifyClaudeError(new Anthropic.APIConnectionTimeoutError()).kind).toBe("network");
    expect(classifyClaudeError(new Anthropic.InternalServerError(500, undefined, "boom", headers)).message).toContain("500");
    expect(classifyClaudeError(new Error("fetch failed")).kind).toBe("network");
    expect(classifyClaudeError(new Error("???")).kind).toBe("unknown");
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
