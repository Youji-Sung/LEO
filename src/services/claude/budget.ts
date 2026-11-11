import { randomUUID } from "node:crypto";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { withOperationsDb } from "@/lib/sqlite-operations";
import { canUseAccount } from "@/lib/auth/account-policy";
import { HttpError } from "@/lib/http-error";
import { apiAttemptContext } from "@/lib/api-attempt-context";
import { PRICING_TABLE } from "@/config/pricing";
import { resolveModel } from "@/services/claude/anthropic-provider";
import { buildChatSystemPrompt, buildPortfolioBlock, REPORT_SYSTEM_PROMPT } from "@/services/claude/prompts/themes";
import { reportSchema } from "@/services/claude/schemas/report";
import { recordUsage, type UsageFeature } from "@/services/claude/usage";
import type { ChatTurnInput, ReportInput, ChatTurnResult, ReportResult } from "@/services/claude/types";

export function budgetLimits() {
  const monthly = Number(process.env.LEO_API_MONTHLY_USD);
  const daily = Number(process.env.LEO_API_USER_DAILY_USD || "20");
  const concurrent = Number(process.env.LEO_API_CONCURRENCY || "5");
  if (!Number.isFinite(monthly) || monthly <= 0 || !Number.isFinite(daily) || daily <= 0 || !Number.isInteger(concurrent) || concurrent < 1) {
    throw new HttpError(503, "API 사용 한도 설정을 확인하고 있습니다.", "budget_not_configured");
  }
  return { monthly, daily, concurrent };
}

// Conservative text-only envelope: UTF-8 bytes rather than optimistic chars/4,
// schema/system overhead, maximum known fallback tariff, and all three SDK attempts.
// The provider's own spend limit remains necessary for billing/pricing discrepancies.
export function maximumAttemptMicros(input: ChatTurnInput | ReportInput): number {
  if (!PRICING_TABLE.some((p) => resolveModel().startsWith(p.prefix))) throw new HttpError(503, "모델 요금 설정이 필요합니다.", "unknown_model_price");
  const isReport = "transcript" in input;
  const system = isReport ? REPORT_SYSTEM_PROMPT + JSON.stringify(betaZodOutputFormat(reportSchema))
    : buildChatSystemPrompt(input.theme, input.mode, input.hints) + buildPortfolioBlock(input.portfolioText || "");
  const tokens = Buffer.byteLength(JSON.stringify(input) + system, "utf8") + 10_000;
  const inputPrice = Math.max(...PRICING_TABLE.map((p) => Math.max(p.pricing.input, p.pricing.cacheWrite)));
  const outputPrice = Math.max(...PRICING_TABLE.map((p) => p.pricing.output));
  return Math.ceil(tokens * inputPrice + (isReport ? 16000 : 2048) * outputPrice);
}

export async function reserveApi(userId: string, feature: string, amountMicros: number): Promise<string> {
  if (!Number.isSafeInteger(amountMicros) || amountMicros < 0) throw new HttpError(503, "API 비용 계산을 확인하고 있습니다.", "invalid_reservation");
  const limited = Boolean(process.env.LEO_API_MONTHLY_USD) || process.env.LEO_PRODUCTION === "1";
  const limits = limited ? budgetLimits() : null;
  return withOperationsDb(async (db) => {
    const user = await db.get<{ status: string; provisioned: boolean; maintenance: string | null }>('SELECT "status", "provisioned", (SELECT "value" FROM "RuntimeControl" WHERE "key" = \'maintenance\') AS maintenance FROM "User" WHERE "id" = ?', userId);
    if (!user || !canUseAccount(user)) throw new HttpError(401, "사용할 수 없는 계정입니다. 다시 로그인해 주세요.", "unauthorized");
    if (user.maintenance === "1") throw new HttpError(503, "서비스를 업데이트하고 있어요. 잠시 후 다시 시도해 주세요.", "maintenance");
    const now = new Date();
    if (limits) {
      // A timed-out process may have been billed: free concurrency, never its budget reservation.
      await db.run('UPDATE "ApiReservation" SET "status" = \'uncertain\' WHERE "status" = \'active\' AND "createdAt" < ?', new Date(now.getTime() - 35 * 60_000).toISOString());
      const month = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
      const day = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      // Prisma adapters can store DateTime as either epoch milliseconds or ISO strings.
      const epoch = '(CASE WHEN typeof("createdAt") IN (\'integer\', \'real\') THEN "createdAt" ELSE (julianday("createdAt") - 2440587.5) * 86400000 END)';
      // One remote read for all balances; avoid a separate network round trip per guard.
      const state = await db.get<Record<string, number>>(`SELECT
        (SELECT COUNT(*) FROM "ApiReservation" WHERE "status" = 'active') AS active,
        (SELECT COUNT(*) FROM "ApiReservation" WHERE "status" = 'active' AND "userId" = ?) AS userActive,
        (SELECT COALESCE(SUM("amountMicros"), 0) FROM "ApiReservation" WHERE "status" IN ('active', 'uncertain')) AS held,
        (SELECT COALESCE(SUM("amountMicros"), 0) FROM "ApiReservation" WHERE "status" IN ('active', 'uncertain') AND "userId" = ?) AS userHeld,
        (SELECT COUNT(*) FROM "ApiReservation" WHERE "userId" = ? AND "createdAt" >= ?) AS recent,
        (SELECT COALESCE(SUM("costUsd"), 0) FROM "UsageRecord" WHERE ${epoch} >= ?) AS monthCost,
        (SELECT COALESCE(SUM("costUsd"), 0) FROM "UsageRecord" WHERE ${epoch} >= ? AND "userId" = ?) AS dayCost`,
        userId, userId, userId, new Date(now.getTime() - 60_000).toISOString(), month, day, userId);
      if (!state) throw new Error("Missing budget state");
      if (Number(state.active) >= limits.concurrent || Number(state.userActive) >= 2) throw new HttpError(429, "진행 중인 응답이 끝난 뒤 다시 시도해 주세요.", "api_busy");
      if (Number(state.recent) >= 20) throw new HttpError(429, "요청이 많습니다. 잠시 후 다시 시도해 주세요.", "api_rate_limit");
      if (Number(state.monthCost) * 1_000_000 + Number(state.held) + amountMicros > limits.monthly * 1_000_000 || Number(state.dayCost) * 1_000_000 + Number(state.userHeld) + amountMicros > limits.daily * 1_000_000) {
        throw new HttpError(429, "API 사용 한도에 도달했습니다. 운영자에게 문의해 주세요.", "budget_exceeded");
      }
    }
    const id = randomUUID();
    await db.run('INSERT INTO "ApiReservation" ("id", "userId", "feature", "amountMicros", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?)', id, userId, feature, amountMicros, now.toISOString(), now.toISOString());
    return id;
  });
}

export async function runMetered<T extends ChatTurnResult | ReportResult>(userId: string, feature: UsageFeature, input: ChatTurnInput | ReportInput, invoke: () => Promise<T>): Promise<T> {
  const perAttempt = process.env.CLAUDE_MOCK === "1" ? 0 : maximumAttemptMicros(input);
  const id = await reserveApi(userId, feature, perAttempt * 3);
  const context = { attempts: 0 };
  try {
    const result = await apiAttemptContext.run(context, invoke);
    if (!PRICING_TABLE.some((p) => result.model.startsWith(p.prefix))) throw new Error("Unpriced provider result; reservation retained");
    await recordUsage({ userId, feature, model: result.model, usage: result.usage, latencyMs: result.latencyMs,
      reservationId: id, uncertainMicros: perAttempt * Math.max(0, context.attempts - 1) });
    return result;
  } catch (error) {
    await withOperationsDb((db) => db.run('UPDATE "ApiReservation" SET "status" = \'uncertain\', "updatedAt" = ? WHERE "id" = ? AND "status" = \'active\'', new Date().toISOString(), id));
    throw error;
  }
}
