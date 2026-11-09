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
  reservationId?: string;
  uncertainMicros?: number;
};

export async function recordUsage(input: RecordUsageInput): Promise<{ id: string; costUsd: number }> {
  const costUsd = estimateCostUsd(input.model, input.usage);
  const rec = await prisma.$transaction(async (tx) => {
    const saved = await tx.usageRecord.create({
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
    if (input.reservationId) await tx.apiReservation.update({ where: { id: input.reservationId }, data: {
      status: input.uncertainMicros ? "uncertain" : "settled", amountMicros: input.uncertainMicros || 0,
    } });
    return saved;
  });
  return { id: rec.id, costUsd };
}
