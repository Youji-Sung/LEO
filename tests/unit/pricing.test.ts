import { describe, expect, it } from "vitest";
import { estimateCostUsd, pricingFor } from "@/config/pricing";

describe("pricing", () => {
  it("matches by model prefix and falls back to default", () => {
    expect(pricingFor("claude-opus-5").input).toBe(5);
    expect(pricingFor("claude-opus-5-5").input).toBe(4);
    expect(pricingFor("claude-sonnet-5-5").output).toBe(10);
    expect(pricingFor("unknown-model").input).toBe(5);
    expect(pricingFor("mock-claude").input).toBe(0);
  });

  it("estimates cost from all four token kinds", () => {
    const cost = estimateCostUsd("claude-opus-5", {
      inputTokens: 1_000_000,
      outputTokens: 100_000,
      cacheReadTokens: 1_000_000,
      cacheWriteTokens: 0,
    });
    expect(cost).toBeCloseTo(5 + 2.5 + 0.5, 6);
  });
});
