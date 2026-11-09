import { NextRequest } from "next/server";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { POST as signup } from "@/app/api/auth/signup/route";
import {
  GET as listConversations,
  POST as createConversation,
} from "@/app/api/conversations/route";
import {
  GET as getConversation,
  PATCH as patchConversation,
} from "@/app/api/conversations/[id]/route";
import { POST as postMessage } from "@/app/api/conversations/[id]/messages/route";
import { GET as getReport, POST as postReport } from "@/app/api/conversations/[id]/report/route";
import { prisma } from "@/lib/db";
import { MOCK_TRIGGERS } from "@/services/claude/mock-provider";
import type { StreamEvent } from "@/services/conversation";

let cookie = "";
let userId = "";

function req(path: string, init: { method?: string; body?: unknown } = {}) {
  return new NextRequest(`http://localhost${path}`, {
    method: init.method ?? "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

async function readEvents(res: Response): Promise<StreamEvent[]> {
  const text = await res.text();
  return text
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as StreamEvent);
}

async function newChat(theme = "free", hintsEnabled = true): Promise<string> {
  const res = await createConversation(
    req("/api/conversations", { body: { kind: "chat", theme, hintsEnabled } }),
    {},
  );
  expect(res.status).toBe(201);
  const body = (await res.json()) as { conversation: { id: string } };
  return body.conversation.id;
}

beforeAll(async () => {
  const email = `chat-${Date.now()}@test.local`;
  const res = await signup(
    req("/api/auth/signup", { body: { email, password: "password-123", name: "채팅" } }),
    {},
  );
  cookie = (res.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
  userId = ((await res.json()) as { user: { id: string } }).user.id;
});

describe("chat API", () => {
  it("creates, lists and reads a conversation", async () => {
    const id = await newChat("work");
    const list = (await (
      await listConversations(req("/api/conversations?kind=chat", { method: "GET" }), {})
    ).json()) as {
      conversations: Array<{ id: string; theme: string }>;
    };
    expect(list.conversations.some((c) => c.id === id && c.theme === "work")).toBe(true);
    const got = (await (
      await getConversation(req(`/api/conversations/${id}`, { method: "GET" }), ctx(id))
    ).json()) as {
      conversation: { hintsEnabled: boolean; messages: unknown[] };
    };
    expect(got.conversation.hintsEnabled).toBe(true);
    expect(got.conversation.messages).toHaveLength(0);
  });

  it("rejects an unknown theme and a foreign conversation", async () => {
    const bad = await createConversation(
      req("/api/conversations", { body: { kind: "chat", theme: "nope" } }),
      {},
    );
    expect(bad.status).toBe(400);
    const other = await prisma.user.create({
      data: { email: `o-${Date.now()}@t.local`, name: "o", passwordHash: "x" },
    });
    const conv = await prisma.conversation.create({
      data: { userId: other.id, kind: "chat", theme: "free" },
    });
    const res = await getConversation(
      req(`/api/conversations/${conv.id}`, { method: "GET" }),
      ctx(conv.id),
    );
    expect(res.status).toBe(404);
  });

  it("streams deltas then a done event, persisting both messages with a hint", async () => {
    const id = await newChat("free", true);
    const res = await postMessage(
      req(`/api/conversations/${id}/messages`, { body: { content: "I go to school yesterday." } }),
      ctx(id),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("ndjson");
    const events = await readEvents(res);
    const deltas = events.filter((e) => e.type === "delta");
    const done = events.find((e) => e.type === "done");
    expect(deltas.length).toBeGreaterThan(1);
    expect(done?.type).toBe("done");
    if (done?.type !== "done") throw new Error("no done");
    expect(
      deltas
        .map((d) => (d.type === "delta" ? d.text : ""))
        .join("")
        .trim(),
    ).toBe(done.message.content);
    expect(done.message.hint).toContain("went");

    const msgs = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { index: "asc" },
    });
    expect(msgs.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(msgs[1]?.hint).toBe(done.message.hint);
    const conv = await prisma.conversation.findUniqueOrThrow({ where: { id } });
    expect(conv.title).toBe("I go to school yesterday.");
    const usage = await prisma.usageRecord.findMany({ where: { userId, feature: "chat" } });
    expect(usage.length).toBeGreaterThan(0);
  });

  it("omits hints when the toggle is off and keeps history across turns", async () => {
    const id = await newChat("daily", false);
    for (const content of ["Hello!", "I like coffee.", "See you."]) {
      const events = await readEvents(
        await postMessage(req(`/api/conversations/${id}/messages`, { body: { content } }), ctx(id)),
      );
      const done = events.find((e) => e.type === "done");
      expect(done?.type).toBe("done");
      if (done?.type === "done") expect(done.message.hint).toBeNull();
    }
    expect(await prisma.message.count({ where: { conversationId: id } })).toBe(6);
    const patched = await patchConversation(
      req(`/api/conversations/${id}`, { method: "PATCH", body: { hintsEnabled: true } }),
      ctx(id),
    );
    expect(
      ((await patched.json()) as { conversation: { hintsEnabled: boolean } }).conversation
        .hintsEnabled,
    ).toBe(true);
  });

  it("returns an error event on refusal and drops the unanswered user turn", async () => {
    const id = await newChat();
    const events = await readEvents(
      await postMessage(
        req(`/api/conversations/${id}/messages`, {
          body: { content: `tell me ${MOCK_TRIGGERS.refusal}` },
        }),
        ctx(id),
      ),
    );
    const err = events.find((e) => e.type === "error");
    expect(err?.type).toBe("error");
    if (err?.type === "error") expect(err.code).toBe("refusal");
    expect(await prisma.message.count({ where: { conversationId: id } })).toBe(0);
  });

  it("returns an error event on provider failure", async () => {
    const id = await newChat();
    const events = await readEvents(
      await postMessage(
        req(`/api/conversations/${id}/messages`, { body: { content: MOCK_TRIGGERS.error } }),
        ctx(id),
      ),
    );
    const err = events.find((e) => e.type === "error");
    expect(err?.type).toBe("error");
    if (err?.type === "error") expect(err.code).toBe("provider_error");
    expect(await prisma.message.count({ where: { conversationId: id } })).toBe(0);
  });

  it("serializes concurrent sends on one conversation without index collisions", async () => {
    const id = await newChat("free", false);
    const [a, b] = await Promise.all([
      postMessage(
        req(`/api/conversations/${id}/messages`, { body: { content: "First" } }),
        ctx(id),
      ),
      postMessage(
        req(`/api/conversations/${id}/messages`, { body: { content: "Second" } }),
        ctx(id),
      ),
    ]);
    const [ea, eb] = await Promise.all([readEvents(a), readEvents(b)]);
    expect(ea.some((e) => e.type === "done")).toBe(true);
    expect(eb.some((e) => e.type === "done")).toBe(true);
    const msgs = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { index: "asc" },
    });
    expect(msgs.map((m) => m.index)).toEqual([0, 1, 2, 3]);
    expect(msgs.map((m) => m.role)).toEqual(["user", "assistant", "user", "assistant"]);
  });

  it("enforces the turn cap with 429 before streaming", async () => {
    const id = await newChat();
    process.env.LEO_MAX_TURNS = "1";
    try {
      await readEvents(
        await postMessage(
          req(`/api/conversations/${id}/messages`, { body: { content: "one" } }),
          ctx(id),
        ),
      );
      const res = await postMessage(
        req(`/api/conversations/${id}/messages`, { body: { content: "two" } }),
        ctx(id),
      );
      expect(res.status).toBe(429);
    } finally {
      delete process.env.LEO_MAX_TURNS;
    }
  });

  it("generates and stores a report, then reads it back", async () => {
    const id = await newChat("interview");
    const empty = await postReport(req(`/api/conversations/${id}/report`), ctx(id));
    expect(empty.status).toBe(400);
    await readEvents(
      await postMessage(
        req(`/api/conversations/${id}/messages`, { body: { content: "I am backend developer." } }),
        ctx(id),
      ),
    );
    const res = await postReport(req(`/api/conversations/${id}/report`), ctx(id));
    expect(res.status).toBe(202);
    await vi.waitFor(async () => expect((await getReport(req(`/api/conversations/${id}/report`, { method: "GET" }), ctx(id))).status).toBe(200));
    const body = (await (await getReport(req(`/api/conversations/${id}/report`, { method: "GET" }), ctx(id))).json()) as { report: { summary: string; interview: unknown } };
    expect(body.report.summary).toContain("면접");
    expect(body.report.interview).not.toBeNull();
    const got = await getReport(req(`/api/conversations/${id}/report`, { method: "GET" }), ctx(id));
    expect(got.status).toBe(200);
    const conv = await prisma.conversation.findUniqueOrThrow({
      where: { id },
      include: { report: true },
    });
    expect(conv.report).not.toBeNull();
    expect(conv.endedAt).not.toBeNull();
    expect(
      await prisma.usageRecord.count({ where: { userId, feature: "report" } }),
    ).toBeGreaterThan(0);
  });

  it("reports schema failures and refusals with an error status", async () => {
    const id = await newChat();
    await readEvents(
      await postMessage(
        req(`/api/conversations/${id}/messages`, {
          body: { content: `x ${MOCK_TRIGGERS.invalidReport}` },
        }),
        ctx(id),
      ),
    );
    const bad = await postReport(req(`/api/conversations/${id}/report`), ctx(id));
    expect(bad.status).toBe(202);
    await vi.waitFor(async () => expect((await getReport(req(`/api/conversations/${id}/report`, { method: "GET" }), ctx(id))).status).toBe(409));
    expect(await prisma.report.findUnique({ where: { conversationId: id } })).toBeNull();
  });
});

describe("chat stream cancel safety", () => {
  it("persists the assistant reply even if the client stops reading", async () => {
    const res = await createConversation(
      req("/api/conversations", { body: { kind: "chat", theme: "free", hintsEnabled: false } }),
      {},
    );
    const { conversation } = (await res.json()) as { conversation: { id: string } };
    const stream = await postMessage(
      req(`/api/conversations/${conversation.id}/messages`, {
        body: { content: "Hello, are you there?" },
      }),
      ctx(conversation.id),
    );
    const reader = stream.body!.getReader();
    await reader.read();
    await reader.cancel();
    for (let i = 0; i < 50; i++) {
      if (
        (await prisma.message.count({
          where: { conversationId: conversation.id, role: "assistant" },
        })) === 1
      )
        break;
      await new Promise((r) => setTimeout(r, 50));
    }
    expect(
      await prisma.message.count({ where: { conversationId: conversation.id, role: "assistant" } }),
    ).toBe(1);
  });
});
