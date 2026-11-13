import { beforeAll, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { createConversation, startCall, sendMessage } from "@/services/conversation";
import { generateAndSaveReport } from "@/services/report";
import { listLearning, saveLearning, reviewLearning } from "@/services/learning";
import { GET, POST } from "@/app/api/learning/route";
import { PATCH, DELETE } from "@/app/api/learning/[id]/route";
import { reportEvidence } from "@/services/report/evidence";
import { buildMockReport } from "@/services/claude/mock-provider";
let userId: string, otherId: string, cookie: string;
const context = (id: string) => ({ params: Promise.resolve({ id }) });
function request(method: string, body?: unknown, authenticated = true) {
  return new NextRequest("http://localhost/api/learning", {
    method,
    headers: { "content-type": "application/json", ...(authenticated ? { cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
beforeAll(async () => {
  const users = await Promise.all(
    ["owner", "other"].map((name) =>
      prisma.user.create({
        data: { email: `${name}-learning-${Date.now()}@test.local`, name, passwordHash: "unused" },
      }),
    ),
  );
  userId = users[0]!.id;
  otherId = users[1]!.id;
  cookie = `leo_session=${(await createSession(userId)).token}`;
});
describe("learning ownership, persistence and reuse", () => {
  it("denies anonymous reads and writes", async () => {
    expect((await GET(request("GET", undefined, false), {})).status).toBe(401);
    expect((await POST(request("POST", {}, false), {})).status).toBe(401);
  });
  it("saves from an owned report once, protects state, and brings targets into a later conversation", async () => {
    const conv = await createConversation({ userId, kind: "chat", theme: "work" });
    for await (const event of sendMessage({
      userId,
      conversationId: conv.id,
      content: "The docs were very good.",
    }))
      expect(event.type).not.toBe("error");
    await generateAndSaveReport(userId, conv.id);
    const item = await saveLearning(userId, conv.id, "vocabulary", 0);
    expect((await saveLearning(userId, conv.id, "vocabulary", 0)).id).toBe(item.id);
    await expect(saveLearning(otherId, conv.id, "vocabulary", 0)).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      reviewLearning(otherId, item.id, { version: 0, outcome: "ready", answer: "excellent" }),
    ).rejects.toMatchObject({ status: 404 });
    const races = await Promise.allSettled(
      [0, 1].map(() =>
        reviewLearning(userId, item.id, { version: 0, outcome: "ready", answer: "excellent" }),
      ),
    );
    expect(races.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await listLearning(userId)).find((i) => i.id === item.id)?.stage).toBe(1);
    expect(
      (
        await PATCH(
          request("PATCH", { version: 0, outcome: "ready", answer: "excellent" }),
          context(item.id),
        )
      ).status,
    ).toBe(409);
    await expect(
      createConversation({
        userId: otherId,
        kind: "chat",
        theme: "daily",
        learningItemIds: [item.id],
      }),
    ).rejects.toMatchObject({ status: 404 });
    const followup = await createConversation({
      userId,
      kind: "chat",
      theme: "work",
      learningItemIds: [item.id],
    });
    expect(followup.learningTargets).toContain("excellent");
    for await (const event of sendMessage({
      userId,
      conversationId: followup.id,
      content: "The documentation was excellent.",
    }))
      expect(event.type).not.toBe("error");
    const observed = await prisma.learningItem.findUniqueOrThrow({ where: { id: item.id } });
    expect(observed.lastUseConversationId).toBe(followup.id);
    expect(observed.stage).toBe(1); // A text match is not proof of mastery.
    expect((await DELETE(request("DELETE"), context(item.id))).status).toBe(200);
    expect(await prisma.report.count({ where: { conversationId: conv.id } })).toBe(1);
  });
  it("persists varied openings and reviewed original speech without rewriting grammar", async () => {
    const a = await createConversation({ userId, kind: "call", theme: "interview" });
    const b = await createConversation({ userId, kind: "call", theme: "interview" });
    expect(a.openingLine).not.toBe(b.openingLine);
    await startCall(userId, b.id, "unused fallback");
    await startCall(userId, b.id, "another fallback");
    expect(await prisma.message.count({ where: { conversationId: b.id } })).toBe(1);
    const rawText = "I am a front and engineer. He don't understand my question.";
    const content = rawText.replace("front and engineer", "frontend engineer");
    for await (const event of sendMessage({
      userId,
      conversationId: b.id,
      content,
      speech: { rawText, reviewed: true },
    }))
      expect(event.type).not.toBe("error");
    const saved = await prisma.message.findFirstOrThrow({
      where: { conversationId: b.id, role: "user" },
    });
    expect(saved.content).toBe(content);
    expect(JSON.parse(saved.speech!).rawText).toBe(rawText);
  });
  it("suppresses uncertain recognition corrections while retaining separate grammatical evidence", () => {
    const messages = [
      { role: "user" as const, content: "I am a front and engineer" },
      { role: "user" as const, content: "He don't understand my question" },
    ];
    const report = buildMockReport({ theme: "free", mode: "call", transcript: messages });
    const evidence = reportEvidence(report, "call", messages);
    expect(evidence.uncertain).toBe(true);
    expect(evidence.report.grammarCorrections.some((c) => c.original.includes("front and"))).toBe(
      false,
    );
    expect(evidence.report.grammarCorrections.some((c) => c.original.includes("He don't"))).toBe(
      true,
    );
  });
});
