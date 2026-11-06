import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { getClaudeProvider } from "@/services/claude";
import * as conversations from "@/services/conversation";
import { generateAndSaveReport, isReportGenerating } from "@/services/report";
import { GET as getReport } from "@/app/api/conversations/[id]/report/route";
import { createSession } from "@/lib/auth/session";
import { NextRequest } from "next/server";
import type { ReportInput } from "@/services/claude/types";

let userId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: `report-dedup-${Date.now()}@test.local`, name: "report-test", passwordHash: "unused" },
  });
  userId = user.id;
});

afterEach(() => vi.restoreAllMocks());

async function conversation() {
  return prisma.conversation.create({
    data: {
      userId, kind: "chat", theme: "interview",
      messages: { create: [{ role: "user", content: "I build a queue yesterday.", index: 0 }] },
    },
  });
}

function holdGeneration() {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const provider = getClaudeProvider();
  const originalGenerate = provider.generateReport.bind(provider);
  const generate = vi.spyOn(provider, "generateReport").mockImplementation(async (input: ReportInput) => {
    await gate;
    return originalGenerate(input);
  });
  const originalRead = conversations.getOwnedConversation;
  let reads = 0;
  vi.spyOn(conversations, "getOwnedConversation").mockImplementation(async (...args) => {
    const result = await originalRead(...args);
    reads++;
    return result;
  });
  return { generate, release, reads: () => reads };
}

describe("report generation deduplication", () => {
  it("exposes pending status only to the owner and returns the saved report after completion", async () => {
    const conv = await conversation();
    const { token } = await createSession(userId);
    const request = () => new NextRequest(`http://localhost/api/conversations/${conv.id}/report`, {
      headers: { cookie: `leo_session=${token}` },
    });
    const ctx = { params: Promise.resolve({ id: conv.id }) };
    const held = holdGeneration();
    const job = generateAndSaveReport(userId, conv.id);
    try {
      await vi.waitFor(() => expect(held.generate).toHaveBeenCalledTimes(1));
      expect(isReportGenerating(userId, conv.id)).toBe(true);
      expect(isReportGenerating("other", conv.id)).toBe(false);
      const pending = await getReport(request(), ctx);
      expect(pending.status).toBe(202);
      expect(await pending.json()).toEqual({ status: "generating" });
      const anonymous = await getReport(new NextRequest(request().url), ctx);
      expect(anonymous.status).toBe(401);
      expect(held.generate).toHaveBeenCalledTimes(1);
    } finally { held.release(); }
    await job;
    expect(isReportGenerating(userId, conv.id)).toBe(false);
    const ready = await getReport(request(), ctx);
    expect(ready.status).toBe(200);
    expect((await ready.json()).report.summary).toBeTruthy();
  });

  it("shares identical concurrent requests and records one model call, but allows later regeneration", async () => {
    const conv = await conversation();
    const held = holdGeneration();
    const before = await prisma.usageRecord.count({ where: { userId, feature: "report" } });
    const jobs = Array.from({ length: 3 }, () => generateAndSaveReport(userId, conv.id));
    try {
      await vi.waitFor(() => expect(held.reads()).toBe(3));
      expect(held.generate).toHaveBeenCalledTimes(1);
    } finally {
      held.release();
    }
    const reports = await Promise.all(jobs);
    expect(reports[1]).toEqual(reports[0]);
    expect(reports[2]).toEqual(reports[0]);
    expect(await prisma.usageRecord.count({ where: { userId, feature: "report" } })).toBe(before + 1);
    expect(await prisma.report.count({ where: { conversationId: conv.id } })).toBe(1);
    await generateAndSaveReport(userId, conv.id);
    expect(held.generate).toHaveBeenCalledTimes(2);
  });

  it("does not reuse a pending report when the transcript has changed", async () => {
    const conv = await conversation();
    const held = holdGeneration();
    const first = generateAndSaveReport(userId, conv.id);
    await vi.waitFor(() => expect(held.generate).toHaveBeenCalledTimes(1));
    await prisma.message.create({ data: { conversationId: conv.id, index: 1, role: "user", content: "We reduced latency by half." } });
    const second = generateAndSaveReport(userId, conv.id);
    try {
      await vi.waitFor(() => expect(held.generate).toHaveBeenCalledTimes(2));
      expect(held.generate.mock.calls[1]![0].transcript.at(-1)?.content).toBe("We reduced latency by half.");
    } finally {
      held.release();
    }
    await Promise.all([first, second]);
  });

  it("does not merge different conversations with identical text", async () => {
    const a = await conversation();
    const b = await conversation();
    const held = holdGeneration();
    const jobs = [generateAndSaveReport(userId, a.id), generateAndSaveReport(userId, b.id)];
    try {
      await vi.waitFor(() => expect(held.generate).toHaveBeenCalledTimes(2));
    } finally {
      held.release();
    }
    const [ra, rb] = await Promise.all(jobs);
    expect(ra!.id).not.toBe(rb!.id);
  });

  it("checks ownership before sharing a pending result", async () => {
    const conv = await conversation();
    const held = holdGeneration();
    const job = generateAndSaveReport(userId, conv.id);
    try {
      await vi.waitFor(() => expect(held.generate).toHaveBeenCalledTimes(1));
      await expect(generateAndSaveReport("different-user", conv.id)).rejects.toMatchObject({ status: 404 });
      expect(held.generate).toHaveBeenCalledTimes(1);
    } finally {
      held.release();
    }
    await job;
  });

  it("clears a rejected request so a provider error can be retried", async () => {
    const conv = await conversation();
    const provider = getClaudeProvider();
    const generate = vi.spyOn(provider, "generateReport").mockRejectedValueOnce(new Error("test network failure"));
    await expect(generateAndSaveReport(userId, conv.id)).rejects.toMatchObject({ code: "provider" });
    expect(isReportGenerating(userId, conv.id)).toBe(false);
    const result = await generateAndSaveReport(userId, conv.id);
    expect(result.report.scores.grammar).toBeDefined();
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("clears invalid output so a schema failure can be retried with the same input", async () => {
    const conv = await conversation();
    const provider = getClaudeProvider();
    const generate = vi.spyOn(provider, "generateReport").mockResolvedValueOnce({
      report: null, rawText: "{}", parseError: "test invalid schema", stopReason: "end_turn",
      model: "mock-claude", latencyMs: 1,
      usage: { inputTokens: 1, outputTokens: 1, cacheReadTokens: 0, cacheWriteTokens: 0 },
    });
    await expect(generateAndSaveReport(userId, conv.id)).rejects.toMatchObject({ code: "invalid" });
    expect(await prisma.report.count({ where: { conversationId: conv.id } })).toBe(0);
    const result = await generateAndSaveReport(userId, conv.id);
    expect(result.report.scores.grammar).toBeDefined();
    expect(generate).toHaveBeenCalledTimes(2);
  });
});
