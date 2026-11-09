import { prisma } from "@/lib/db";
import { USAGE_FEATURES, type UsageFeature } from "@/services/claude/usage";
import { usage } from "@/content/ko";
import { canUseAccount } from "@/lib/auth/account-policy";
import { HttpError } from "@/lib/http-error";

export const USAGE_PERIODS = ["today", "7d", "30d", "all"] as const;
export type UsagePeriod = (typeof USAGE_PERIODS)[number];

export const USAGE_PERIOD_LABELS: Record<UsagePeriod, string> = usage.periods;

export const USAGE_FEATURE_LABELS: Record<UsageFeature, string> = usage.features;

const DAY_MS = 24 * 60 * 60 * 1000;

export function periodStart(period: UsagePeriod, now: Date = new Date()): Date | null {
  switch (period) {
    case "today": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "7d":
      return new Date(now.getTime() - 7 * DAY_MS);
    case "30d":
      return new Date(now.getTime() - 30 * DAY_MS);
    case "all":
      return null;
  }
}

export type UsageTotals = {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costUsd: number;
};

export type UsageByUser = UsageTotals & { userId: string; name: string; email: string };

export type UsageByFeature = {
  feature: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

export type UsageRecentRow = {
  id: string;
  createdAt: Date;
  userName: string;
  feature: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costUsd: number;
  latencyMs: number;
};

export type UsageSummary = {
  period: UsagePeriod;
  since: Date | null;
  totals: UsageTotals;
  byUser: UsageByUser[];
  byFeature: UsageByFeature[];
  recent: UsageRecentRow[];
};

export type GetUsageSummaryInput = {
  // The database role, not request parameters, determines aggregate visibility.
  viewerUserId: string;
  period: UsagePeriod;
  userId?: string;
  now?: Date;
};

export const RECENT_LIMIT = 50;

const EMPTY_TOTALS: UsageTotals = {
  calls: 0,
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
  costUsd: 0,
};

export async function getUsageSummary(input: GetUsageSummaryInput): Promise<UsageSummary> {
  const viewer = await prisma.user.findUnique({ where: { id: input.viewerUserId } });
  if (!viewer || !canUseAccount(viewer)) throw new HttpError(401, "로그인이 필요합니다.", "unauthorized");
  const admin = viewer.role === "admin";
  if (!admin && input.userId && input.userId !== viewer.id) throw new HttpError(403, "본인의 사용량만 볼 수 있습니다.", "forbidden");
  const selectedId = admin ? input.userId : viewer.id;
  const visibleUsers = admin ? {} : { userId: viewer.id };
  const since = periodStart(input.period, input.now);
  const timeWhere = since ? { createdAt: { gte: since } } : {};
  const where = { ...timeWhere, ...(selectedId ? { userId: selectedId } : {}) };

  const [agg, userGroups, users, featureGroups, recentRows] = await Promise.all([
    prisma.usageRecord.aggregate({
      where,
      _count: { _all: true },
      _sum: { inputTokens: true, outputTokens: true, cacheReadTokens: true, cacheWriteTokens: true, costUsd: true },
    }),
    prisma.usageRecord.groupBy({
      by: ["userId"],
      where: { ...timeWhere, ...visibleUsers },
      _count: { _all: true },
      _sum: { inputTokens: true, outputTokens: true, cacheReadTokens: true, cacheWriteTokens: true, costUsd: true },
    }),
    prisma.user.findMany({ where: admin ? {} : { id: viewer.id }, select: { id: true, name: true, email: true }, orderBy: { createdAt: "asc" } }),
    prisma.usageRecord.groupBy({
      by: ["feature"],
      where,
      _count: { _all: true },
      _sum: { inputTokens: true, outputTokens: true, costUsd: true },
    }),
    prisma.usageRecord.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: RECENT_LIMIT,
      include: { user: { select: { name: true } } },
    }),
  ]);

  const totals: UsageTotals = {
    calls: agg._count._all,
    inputTokens: agg._sum.inputTokens ?? 0,
    outputTokens: agg._sum.outputTokens ?? 0,
    cacheReadTokens: agg._sum.cacheReadTokens ?? 0,
    cacheWriteTokens: agg._sum.cacheWriteTokens ?? 0,
    costUsd: agg._sum.costUsd ?? 0,
  };

  const byUserMap = new Map(userGroups.map((g) => [g.userId, g]));
  const byUser: UsageByUser[] = users.map((u) => {
    const g = byUserMap.get(u.id);
    return {
      userId: u.id,
      name: u.name,
      email: u.email,
      ...(g
        ? {
            calls: g._count._all,
            inputTokens: g._sum.inputTokens ?? 0,
            outputTokens: g._sum.outputTokens ?? 0,
            cacheReadTokens: g._sum.cacheReadTokens ?? 0,
            cacheWriteTokens: g._sum.cacheWriteTokens ?? 0,
            costUsd: g._sum.costUsd ?? 0,
          }
        : EMPTY_TOTALS),
    };
  });

  const byFeatureMap = new Map(featureGroups.map((g) => [g.feature, g]));
  const knownFeatures: string[] = [...USAGE_FEATURES];
  const unknownFeatures = featureGroups.map((g) => g.feature).filter((f) => !knownFeatures.includes(f));
  const byFeature: UsageByFeature[] = [...knownFeatures, ...unknownFeatures].flatMap((feature) => {
    const g = byFeatureMap.get(feature);
    if (!g) return [];
    return [
      {
        feature,
        calls: g._count._all,
        inputTokens: g._sum.inputTokens ?? 0,
        outputTokens: g._sum.outputTokens ?? 0,
        costUsd: g._sum.costUsd ?? 0,
      },
    ];
  });

  const recent: UsageRecentRow[] = recentRows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    userName: r.user.name,
    feature: r.feature,
    model: r.model,
    inputTokens: r.inputTokens,
    outputTokens: r.outputTokens,
    cacheReadTokens: r.cacheReadTokens,
    cacheWriteTokens: r.cacheWriteTokens,
    costUsd: r.costUsd,
    latencyMs: r.latencyMs,
  }));

  return { period: input.period, since, totals, byUser, byFeature, recent };
}
