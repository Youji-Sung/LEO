import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { getClaudeProvider } from "@/services/claude";
import { sendMessage, type StreamEvent } from "@/services/conversation";

let userId: string;
beforeAll(async () => {
  userId = (await prisma.user.create({ data: {
    email: `hint-grounding-${Date.now()}@test.local`, name: "QA", passwordHash: "unused",
  } })).id;
});
afterEach(() => vi.restoreAllMocks());

it("filters a stale provider hint before both the done event and persistence, without retrying the model", async () => {
  const conv = await prisma.conversation.create({ data: {
    userId, kind: "chat", theme: "daily", hintsEnabled: true,
    messages: { create: [
      { role: "user", content: "I go there yesterday.", index: 0 },
      { role: "assistant", content: "What did you order?", index: 1 },
    ] },
  } });
  const provider = getClaudeProvider();
  const original = provider.chatTurn.bind(provider);
  const generate = vi.spyOn(provider, "chatTurn").mockImplementation(async (...args) => ({
    ...await original(...args), hint: "I go there yesterday → I went there yesterday · 과거형",
  }));
  const events: StreamEvent[] = [];
  for await (const event of sendMessage({ userId, conversationId: conv.id, content: "Does the cake contain nuts?" })) events.push(event);
  const done = events.find((event) => event.type === "done");
  expect(done?.type).toBe("done");
  if (done?.type !== "done") throw new Error("Missing done event");
  expect(done.message.hint).toBeNull();
  expect(done.message.content).toBeTruthy();
  expect((await prisma.message.findUniqueOrThrow({ where: { id: done.message.id } })).hint).toBeNull();
  expect(generate).toHaveBeenCalledTimes(1);
});
