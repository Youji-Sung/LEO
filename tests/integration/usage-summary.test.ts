import { NextRequest } from "next/server";
import { beforeAll, describe, expect, it } from "vitest";
import { GET as usageGet } from "@/app/api/usage/route";
import { POST as signup } from "@/app/api/auth/signup/route";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { getUsageSummary, periodStart, RECENT_LIMIT } from "@/services/usage";

const DAY_MS = 24 * 60 * 60 * 1000;
const now = new Date("2026-11-03T12:00:00.000Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * DAY_MS);

let aliceId: string;
let bobId: string;

type Rec = {
  userId: string;
  feature: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  costUsd: number;
  createdAt: Date;
};

const records: Rec[] = [];

beforeAll(async () => {
  // 다른 테스트 파일이 남긴 사용량이 합계를 오염시키지 않도록 비운다.
  await prisma.usageRecord.deleteMany({});
  const stamp = Date.now();
  const alice = await prisma.user.create({
    data: { email: `alice-${stamp}@test.local`, name: "앨리스", passwordHash: await hashPassword("password-123") },
  });
  const bob = await prisma.user.create({
    data: { email: `bob-${stamp}@test.local`, name: "밥", passwordHash: await hashPassword("password-123") },
  });
  aliceId = alice.id;
  bobId = bob.id;

  records.push(
    { userId: aliceId, feature: "chat", inputTokens: 1000, outputTokens: 100, cacheReadTokens: 50, cacheWriteTokens: 10, costUsd: 0.01, createdAt: daysAgo(0) },
    { userId: aliceId, feature: "call", inputTokens: 2000, outputTokens: 200, cacheReadTokens: 0, cacheWriteTokens: 20, costUsd: 0.02, createdAt: daysAgo(3) },
    { userId: aliceId, feature: "report", inputTokens: 3000, outputTokens: 300, costUsd: 0.03, createdAt: daysAgo(10) },
    { userId: bobId, feature: "chat", inputTokens: 400, outputTokens: 40, cacheReadTokens: 5, costUsd: 0.004, createdAt: daysAgo(1) },
    { userId: bobId, feature: "portfolio", inputTokens: 500, outputTokens: 50, costUsd: 0.005, createdAt: daysAgo(20) },
    { userId: bobId, feature: "call", inputTokens: 6000, outputTokens: 600, cacheWriteTokens: 60, costUsd: 0.06, createdAt: daysAgo(40) },
  );
  await prisma.usageRecord.createMany({
    data: records.map((r) => ({
      ...r,
      cacheReadTokens: r.cacheReadTokens ?? 0,
      cacheWriteTokens: r.cacheWriteTokens ?? 0,
      model: "claude-opus-5",
      latencyMs: 100,
    })),
  });
});

function sum(rs: Rec[], key: "inputTokens" | "outputTokens" | "cacheReadTokens" | "cacheWriteTokens" | "costUsd"): number {
  return rs.reduce((acc, r) => acc + (r[key] ?? 0), 0);
}

describe("periodStart", () => {
  it("computes the window start", () => {
    expect(periodStart("all", now)).toBeNull();
    expect(periodStart("7d", now)?.getTime()).toBe(now.getTime() - 7 * DAY_MS);
    expect(periodStart("30d", now)?.getTime()).toBe(now.getTime() - 30 * DAY_MS);
    const today = periodStart("today", now);
    expect(today).not.toBeNull();
    expect(today!.getTime()).toBeLessThanOrEqual(now.getTime());
    expect(now.getTime() - today!.getTime()).toBeLessThan(DAY_MS);
  });
});

describe("getUsageSummary", () => {
  it("sums totals, byUser and byFeature over all time", async () => {
    const s = await getUsageSummary({ viewerUserId: aliceId, period: "all", now });
    expect(s.since).toBeNull();
    expect(s.totals.calls).toBe(6);
    expect(s.totals.inputTokens).toBe(sum(records, "inputTokens"));
    expect(s.totals.outputTokens).toBe(sum(records, "outputTokens"));
    expect(s.totals.cacheReadTokens).toBe(sum(records, "cacheReadTokens"));
    expect(s.totals.cacheWriteTokens).toBe(sum(records, "cacheWriteTokens"));
    expect(s.totals.costUsd).toBeCloseTo(sum(records, "costUsd"), 10);

    const alice = s.byUser.find((u) => u.userId === aliceId);
    const bob = s.byUser.find((u) => u.userId === bobId);
    const aliceRecs = records.filter((r) => r.userId === aliceId);
    const bobRecs = records.filter((r) => r.userId === bobId);
    expect(alice).toMatchObject({ name: "앨리스", calls: 3, inputTokens: 6000, outputTokens: 600, cacheReadTokens: 50, cacheWriteTokens: 30 });
    expect(alice!.costUsd).toBeCloseTo(sum(aliceRecs, "costUsd"), 10);
    expect(bob).toMatchObject({ name: "밥", calls: 3, inputTokens: 6900, outputTokens: 690, cacheReadTokens: 5, cacheWriteTokens: 60 });
    expect(bob!.costUsd).toBeCloseTo(sum(bobRecs, "costUsd"), 10);

    const byFeature = Object.fromEntries(s.byFeature.map((f) => [f.feature, f]));
    expect(byFeature.chat).toMatchObject({ calls: 2, inputTokens: 1400, outputTokens: 140 });
    expect(byFeature.chat!.costUsd).toBeCloseTo(0.014, 10);
    expect(byFeature.call).toMatchObject({ calls: 2, inputTokens: 8000, outputTokens: 800 });
    expect(byFeature.report).toMatchObject({ calls: 1, inputTokens: 3000, outputTokens: 300 });
    expect(byFeature.portfolio).toMatchObject({ calls: 1, inputTokens: 500, outputTokens: 50 });
    expect(s.byFeature.map((f) => f.feature)).toEqual(["chat", "call", "report", "portfolio"]);
  });

  it("filters by period", async () => {
    const d30 = await getUsageSummary({ viewerUserId: aliceId, period: "30d", now });
    const in30 = records.filter((r) => r.createdAt.getTime() >= now.getTime() - 30 * DAY_MS);
    expect(in30).toHaveLength(5);
    expect(d30.totals.calls).toBe(5);
    expect(d30.totals.inputTokens).toBe(sum(in30, "inputTokens"));
    expect(d30.totals.cacheWriteTokens).toBe(sum(in30, "cacheWriteTokens"));
    expect(d30.byUser.find((u) => u.userId === bobId)).toMatchObject({ calls: 2, inputTokens: 900 });
    expect(d30.byFeature.find((f) => f.feature === "call")).toMatchObject({ calls: 1, inputTokens: 2000 });

    const d7 = await getUsageSummary({ viewerUserId: aliceId, period: "7d", now });
    expect(d7.totals.calls).toBe(3);
    expect(d7.totals.inputTokens).toBe(1000 + 2000 + 400);
    expect(d7.byFeature.map((f) => f.feature)).toEqual(["chat", "call"]);

    const today = await getUsageSummary({ viewerUserId: aliceId, period: "today", now });
    expect(today.totals.calls).toBe(1);
    expect(today.totals.inputTokens).toBe(1000);
  });

  it("narrows totals, byFeature and recent with userId but keeps byUser for everyone", async () => {
    const s = await getUsageSummary({ viewerUserId: aliceId, period: "all", userId: bobId, now });
    const bobRecs = records.filter((r) => r.userId === bobId);
    expect(s.totals.calls).toBe(3);
    expect(s.totals.inputTokens).toBe(sum(bobRecs, "inputTokens"));
    expect(s.totals.costUsd).toBeCloseTo(sum(bobRecs, "costUsd"), 10);
    expect(s.byFeature.map((f) => f.feature)).toEqual(["chat", "call", "portfolio"]);
    expect(s.recent).toHaveLength(3);
    expect(s.recent.every((r) => r.userName === "밥")).toBe(true);
    expect(s.byUser.map((u) => u.userId)).toEqual(expect.arrayContaining([aliceId, bobId]));
    expect(s.byUser.find((u) => u.userId === aliceId)?.calls).toBe(3);
  });

  it("returns recent newest-first and capped at 50", async () => {
    const before = await getUsageSummary({ viewerUserId: aliceId, period: "all", now });
    const createdAts = before.recent.map((r) => r.createdAt.getTime());
    expect(createdAts).toEqual([...createdAts].sort((a, b) => b - a));
    expect(before.recent[0]).toMatchObject({ userName: "앨리스", feature: "chat", inputTokens: 1000 });

    await prisma.usageRecord.createMany({
      data: Array.from({ length: 55 }, (_, i) => ({
        userId: aliceId,
        feature: "chat",
        model: "claude-opus-5",
        inputTokens: 1,
        outputTokens: 1,
        costUsd: 0.000001,
        latencyMs: 1,
        createdAt: new Date(now.getTime() - 100 * DAY_MS - i * 1000),
      })),
    });
    const s = await getUsageSummary({ viewerUserId: aliceId, period: "all", userId: aliceId, now });
    expect(s.totals.calls).toBe(3 + 55);
    expect(s.recent).toHaveLength(RECENT_LIMIT);
    const times = s.recent.map((r) => r.createdAt.getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));
    expect(s.recent[0]?.inputTokens).toBe(1000);
    expect(s.recent[2]?.inputTokens).toBe(3000);
    expect(s.recent[3]?.inputTokens).toBe(1);
  });
});

describe("GET /api/usage", () => {
  function get(query: string, cookie?: string) {
    return new NextRequest(`http://localhost/api/usage${query}`, {
      method: "GET",
      headers: cookie ? { cookie } : {},
    });
  }

  it("requires login, validates period, returns the summary", async () => {
    const anon = await usageGet(get("?period=7d"), {});
    expect(anon.status).toBe(401);

    const email = `usage-api-${Date.now()}@test.local`;
    const res = await signup(
      new NextRequest("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "password-123", name: "뷰어" }),
      }),
      {},
    );
    expect(res.status).toBe(201);
    const cookie = (res.headers.get("set-cookie") ?? "").split(";")[0] ?? "";

    const bad = await usageGet(get("?period=yesterday", cookie), {});
    expect(bad.status).toBe(400);

    const ok = await usageGet(get("?period=all", cookie), {});
    expect(ok.status).toBe(200);
    const body = (await ok.json()) as { period: string; totals: { calls: number }; byUser: unknown[]; recent: unknown[] };
    expect(body.period).toBe("all");
    expect(body.totals.calls).toBe(6 + 55);
    expect(body.byUser.length).toBeGreaterThanOrEqual(3);
    expect(body.recent).toHaveLength(50);

    const filtered = await usageGet(get(`?period=all&userId=${bobId}`, cookie), {});
    const fb = (await filtered.json()) as { totals: { calls: number } };
    expect(fb.totals.calls).toBe(3);

    const dflt = await usageGet(get("", cookie), {});
    const db = (await dflt.json()) as { period: string };
    expect(db.period).toBe("7d");
  });
});
