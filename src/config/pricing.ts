// USD / 1M 토큰. 모델 ID 접두사로 매칭하며, 없으면 DEFAULT_PRICING 을 쓴다.
export type Pricing = { input: number; output: number; cacheRead: number; cacheWrite: number };

export const PRICING_TABLE: Array<{ prefix: string; pricing: Pricing }> = [
  { prefix: "claude-opus-5-5", pricing: { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 } },
  { prefix: "claude-opus-5", pricing: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 } },
  { prefix: "claude-opus-4", pricing: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 } },
  { prefix: "claude-fable-5", pricing: { input: 10, output: 50, cacheRead: 1, cacheWrite: 12.5 } },
  { prefix: "claude-sonnet-5", pricing: { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 } },
  { prefix: "claude-sonnet-4", pricing: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 } },
  { prefix: "claude-haiku-5", pricing: { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 } },
  { prefix: "mock", pricing: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } },
];

export const DEFAULT_PRICING: Pricing = { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 };

export function pricingFor(model: string): Pricing {
  const hit = PRICING_TABLE.find((p) => model.startsWith(p.prefix));
  return hit ? hit.pricing : DEFAULT_PRICING;
}

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
};

export function estimateCostUsd(model: string, usage: TokenUsage): number {
  const p = pricingFor(model);
  const perToken = 1 / 1_000_000;
  return (
    usage.inputTokens * p.input * perToken +
    usage.outputTokens * p.output * perToken +
    usage.cacheReadTokens * p.cacheRead * perToken +
    usage.cacheWriteTokens * p.cacheWrite * perToken
  );
}
