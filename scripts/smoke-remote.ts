// Explicit operator smoke test: temporary fixtures only, always mock the AI provider.
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../src/lib/db";
import { createSession, findUserBySessionToken } from "../src/lib/auth/session";
import { reserveApi } from "../src/services/claude/budget";
import { createConversation, sendMessage } from "../src/services/conversation";
import { enqueueReport, reportJobState } from "../src/services/report";
import { setTimeout as sleep } from "node:timers/promises";

async function main() {
  if (!process.env.DATABASE_URL?.startsWith("libsql:") || process.env.CLAUDE_MOCK !== "1") throw new Error("전용 Turso 연결과 CLAUDE_MOCK=1이 필요합니다.");
  const user = await prisma.user.create({ data: { email: `qa-${randomUUID()}@example.invalid`, name: "temporary QA", passwordHash: "unusable", provisioned: true } });
  let conversationId: string | undefined;
  try {
    const session = await createSession(user.id);
    assert.equal((await findUserBySessionToken(session.token))?.id, user.id);
    // Two simultaneous reservations cannot both exceed the user's configured budget.
    const daily = Number(process.env.LEO_API_USER_DAILY_USD || "20");
    const amount = Math.floor(daily * 0.75 * 1_000_000);
    const reservations = await Promise.allSettled([reserveApi(user.id, "chat", amount), reserveApi(user.id, "chat", amount)]);
    assert.equal(reservations.filter((r) => r.status === "fulfilled").length, 1);
    await prisma.apiReservation.deleteMany({ where: { userId: user.id } });
    const conv = await createConversation({ userId: user.id, kind: "chat", theme: "daily" });
    conversationId = conv.id;
    const events = [];
    for await (const event of sendMessage({ userId: user.id, conversationId: conv.id, content: "I go there yesterday." })) events.push(event);
    assert.equal(events.at(-1)?.type, "done");
    await enqueueReport(user.id, conv.id);
    for (let i = 0; i < 120 && (await reportJobState(user.id, conv.id))?.status === "generating"; i++) await sleep(250);
    assert.equal((await reportJobState(user.id, conv.id))?.status, "complete");
    assert.equal(await prisma.report.count({ where: { conversationId: conv.id } }), 1);
    assert.equal(await prisma.usageRecord.count({ where: { userId: user.id } }), 2);
    console.log("Remote DB smoke PASS: session, atomic budget, chat, report and usage. No paid AI calls.");
  } finally {
    if (conversationId) {
      await prisma.reportJob.deleteMany({ where: { conversationId } });
      await prisma.workLease.deleteMany({ where: { key: { in: [`report:${conversationId}`, `conversation:${conversationId}`] } } });
    }
    await prisma.apiReservation.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
}
main().catch((e) => { console.error(e instanceof Error ? e.message : "원격 DB 검사 실패"); process.exitCode = 1; }).finally(() => prisma.$disconnect());
