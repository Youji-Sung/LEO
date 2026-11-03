import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { recordUsage } from "@/services/claude/usage";
import { assertTurnAllowed, countUserTurns, maxTurnsPerConversation, TurnCapError } from "@/services/claude/turn-cap";

let userId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: `usage-${Date.now()}@test.local`, name: "u", passwordHash: await hashPassword("password-123") },
  });
  userId = user.id;
});

describe("recordUsage", () => {
  it("stores tokens and estimated cost", async () => {
    const { id, costUsd } = await recordUsage({
      userId,
      feature: "chat",
      model: "claude-opus-5",
      usage: { inputTokens: 1000, outputTokens: 200, cacheReadTokens: 500, cacheWriteTokens: 0 },
      latencyMs: 321,
    });
    const rec = await prisma.usageRecord.findUniqueOrThrow({ where: { id } });
    expect(rec.inputTokens).toBe(1000);
    expect(rec.cacheReadTokens).toBe(500);
    expect(rec.latencyMs).toBe(321);
    expect(costUsd).toBeCloseTo(0.005 + 0.005 + 0.00025, 8);
    expect(rec.costUsd).toBeCloseTo(costUsd, 10);
  });
});

describe("turn cap", () => {
  it("uses LEO_MAX_TURNS when valid, else 60", () => {
    const prev = process.env.LEO_MAX_TURNS;
    process.env.LEO_MAX_TURNS = "5";
    expect(maxTurnsPerConversation()).toBe(5);
    process.env.LEO_MAX_TURNS = "abc";
    expect(maxTurnsPerConversation()).toBe(60);
    if (prev === undefined) delete process.env.LEO_MAX_TURNS;
    else process.env.LEO_MAX_TURNS = prev;
  });

  it("blocks the turn once the user has reached the limit", async () => {
    const conv = await prisma.conversation.create({ data: { userId, kind: "chat", theme: "free" } });
    await assertTurnAllowed(conv.id, 2);
    await prisma.message.createMany({
      data: [
        { conversationId: conv.id, role: "user", content: "a", index: 0 },
        { conversationId: conv.id, role: "assistant", content: "b", index: 1 },
        { conversationId: conv.id, role: "user", content: "c", index: 2 },
      ],
    });
    expect(await countUserTurns(conv.id)).toBe(2);
    await expect(assertTurnAllowed(conv.id, 2)).rejects.toBeInstanceOf(TurnCapError);
    await assertTurnAllowed(conv.id, 3);
  });
});
