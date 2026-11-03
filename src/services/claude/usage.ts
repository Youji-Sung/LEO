import { estimateCostUsd, type TokenUsage } from "@/config/pricing";
import { prisma } from "@/lib/db";

export const USAGE_FEATURES = ["chat", "call", "report", "portfolio"] as const;
export type UsageFeature = (typeof USAGE_FEATURES)[number];

export type RecordUsageInput = {
  userId: string;
  feature: UsageFeature;
  model: string;
  usage: TokenUsage;
  latencyMs: number;
};

export async function recordUsage(input: RecordUsageInput): Promise<{ id: string; costUsd: number }> {
  const costUsd = estimateCostUsd(input.model, input.usage);
  const rec = await prisma.usageRecord.create({
    data: {
      userId: input.userId,
      feature: input.feature,
      model: input.model,
      inputTokens: input.usage.inputTokens,
      outputTokens: input.usage.outputTokens,
      cacheReadTokens: input.usage.cacheReadTokens,
      cacheWriteTokens: input.usage.cacheWriteTokens,
      costUsd,
      latencyMs: input.latencyMs,
    },
    select: { id: true },
  });
  return { id: rec.id, costUsd };
}
