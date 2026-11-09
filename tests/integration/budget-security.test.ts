import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { reserveApi, runMetered, maximumAttemptMicros } from "@/services/claude/budget";
import { recoverInterruptedReports } from "@/services/report";
import { getClaudeProvider } from "@/services/claude";
import type { ChatTurnInput } from "@/services/claude/types";

let userId: string;
const input: ChatTurnInput = { theme: "free", mode: "chat", hints: false, messages: [{ role: "user", content: "Hello." }] };
beforeEach(async () => {
  vi.stubEnv("LEO_API_MONTHLY_USD", "200"); vi.stubEnv("LEO_API_USER_DAILY_USD", "200");
  await prisma.apiReservation.deleteMany(); await prisma.usageRecord.deleteMany();
  userId = (await prisma.user.create({ data: { email: `${randomUUID()}@test.local`, name: "budget", passwordHash: "unused", provisioned: true } })).id;
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

it("counts outstanding reservations atomically against the monthly cap", async () => {
  const code = "import { reserveApi } from './src/services/claude/budget.ts'; try { reserveApi(process.argv[1], 'chat', 110000000); } catch { process.exitCode = 1; }";
  const calls = await Promise.allSettled(Array.from({ length: 3 }, () => promisify(execFile)(process.execPath, ["--import", "tsx", "--input-type=module", "-e", code, userId], { env: process.env })));
  expect(calls.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(await prisma.apiReservation.count()).toBe(1);
});
it("keeps unknown costs across restarts and releases concurrency only", async () => {
  reserveApi(userId, "chat", 190_000_000);
  await recoverInterruptedReports();
  expect(() => reserveApi(userId, "chat", 20_000_000)).toThrow(/한도/);
  expect((await prisma.apiReservation.findFirst())?.status).toBe("uncertain");
});
it("settles usage and reservation together", async () => {
  await runMetered(userId, "chat", input, () => getClaudeProvider().chatTurn(input, () => {}));
  expect(await prisma.usageRecord.count({ where: { userId } })).toBe(1);
  expect((await prisma.apiReservation.findFirst())?.status).toBe("settled");
});
it("denies at the budget boundary before an external call", async () => {
  await prisma.usageRecord.create({ data: { userId, model: "claude-opus-5", feature: "chat", costUsd: 200, inputTokens: 1, outputTokens: 1, latencyMs: 1 } });
  vi.stubEnv("CLAUDE_MOCK", "0");
  const invoke = vi.fn();
  await expect(runMetered(userId, "chat", input, invoke)).rejects.toMatchObject({ code: "budget_exceeded" });
  expect(invoke).not.toHaveBeenCalled();
});
it("denies a disabled user even after a request was admitted by the HTTP route", async () => {
  await prisma.user.update({ where: { id: userId }, data: { status: "suspended" } });
  const invoke = vi.fn();
  await expect(runMetered(userId, "chat", input, invoke)).rejects.toMatchObject({ status: 401 });
  expect(invoke).not.toHaveBeenCalled();
});
it("retains uncertain cost on transport failure", async () => {
  vi.stubEnv("CLAUDE_MOCK", "0");
  await expect(runMetered(userId, "chat", input, async () => { throw new Error("transport failure"); })).rejects.toThrow("transport failure");
  const held = await prisma.apiReservation.findFirst();
  expect(held?.status).toBe("uncertain"); expect(held!.amountMicros).toBeGreaterThan(0);
});
it("requires a budget and known model price in production", () => {
  vi.stubEnv("LEO_API_MONTHLY_USD", ""); vi.stubEnv("LEO_PRODUCTION", "1");
  expect(() => reserveApi(userId, "chat", 1)).toThrow(/설정/);
  vi.stubEnv("LEO_CLAUDE_MODEL", "unknown-model");
  expect(() => maximumAttemptMicros(input)).toThrow(/요금/);
});
