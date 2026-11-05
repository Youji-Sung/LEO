import { NextRequest } from "next/server";
import { beforeAll, describe, expect, it } from "vitest";
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
import { POST as postReport } from "@/app/api/conversations/[id]/report/route";
import { prisma } from "@/lib/db";
import { THEMES } from "@/services/claude/prompts/themes";
import { listConversations as listService, toProviderMessages } from "@/services/conversation";
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

type ConvView = {
  conversation: {
    startedAt: string;
    messages: Array<{ role: string; content: string; index: number }>;
  };
};

async function newCall(theme = "interview"): Promise<string> {
  const res = await createConversation(
    req("/api/conversations", { body: { kind: "call", theme, durationMin: 10 } }),
    {},
  );
  expect(res.status).toBe(201);
  return ((await res.json()) as { conversation: { id: string } }).conversation.id;
}

async function readConv(id: string): Promise<ConvView> {
  const res = await getConversation(req(`/api/conversations/${id}`, { method: "GET" }), ctx(id));
  return (await res.json()) as ConvView;
}

beforeAll(async () => {
  const email = `call-${Date.now()}@test.local`;
  const res = await signup(
    req("/api/auth/signup", { body: { email, password: "password-123", name: "통화" } }),
    {},
  );
  cookie = (res.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
  userId = ((await res.json()) as { user: { id: string } }).user.id;
});

describe("toProviderMessages", () => {
  it("drops the stored opening line so the first message sent to Claude is the user's", () => {
    expect(
      toProviderMessages([
        { role: "assistant", content: "Hi there" },
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Reply" },
      ]),
    ).toEqual([
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Reply" },
    ]);
    expect(toProviderMessages([{ role: "assistant", content: "Hi there" }])).toEqual([]);
    expect(toProviderMessages([])).toEqual([]);
  });
});

describe("call opening line (외부 피드백 1)", () => {
  it("stores the partner's opening line as message 0 when the call starts, once", async () => {
    const id = await newCall("interview");
    const before = await readConv(id);
    expect(before.conversation.messages).toHaveLength(0);

    await new Promise((r) => setTimeout(r, 15));
    const started = await patchConversation(
      req(`/api/conversations/${id}`, { method: "PATCH", body: { started: true } }),
      ctx(id),
    );
    expect(started.status).toBe(200);
    const after = await readConv(id);
    expect(after.conversation.messages).toEqual([
      expect.objectContaining({
        role: "assistant",
        content: THEMES.interview.openingLine,
        index: 0,
      }),
    ]);
    expect(new Date(after.conversation.startedAt).getTime()).toBeGreaterThan(
      new Date(before.conversation.startedAt).getTime(),
    );

    // 두 번째 시작(새로고침 뒤 이어하기)은 메시지를 더하지도 시작 시각을 바꾸지도 않는다.
    await patchConversation(
      req(`/api/conversations/${id}`, { method: "PATCH", body: { started: true } }),
      ctx(id),
    );
    const again = await readConv(id);
    expect(again.conversation.messages).toHaveLength(1);
    expect(again.conversation.startedAt).toBe(after.conversation.startedAt);
  });

  it("keeps the opening line in the transcript while the user turn still goes through", async () => {
    const id = await newCall("daily");
    await patchConversation(
      req(`/api/conversations/${id}`, { method: "PATCH", body: { started: true } }),
      ctx(id),
    );
    const res = await postMessage(
      req(`/api/conversations/${id}/messages`, { body: { content: "Hello! I just moved here." } }),
      ctx(id),
    );
    expect(res.status).toBe(200);
    const events = (await res.text())
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l) as StreamEvent);
    expect(events.some((e) => e.type === "done")).toBe(true);

    const msgs = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { index: "asc" },
    });
    expect(msgs.map((m) => [m.role, m.index])).toEqual([
      ["assistant", 0],
      ["user", 1],
      ["assistant", 2],
    ]);
    expect(msgs[0]!.content).toBe(THEMES.daily.openingLine);

    // 메시지 수에 첫 인사가 들어가고, 리포트도 만들어진다.
    const list = (await (
      await listConversations(req("/api/conversations?kind=call", { method: "GET" }), {})
    ).json()) as { conversations: Array<{ id: string; messageCount: number }> };
    expect(list.conversations.find((c) => c.id === id)?.messageCount).toBe(3);
    const report = await postReport(req(`/api/conversations/${id}/report`), ctx(id));
    expect(report.status).toBe(200);
  });

  it("refuses to start a chat as a call", async () => {
    const res = await createConversation(
      req("/api/conversations", { body: { kind: "chat", theme: "free" } }),
      {},
    );
    const { conversation } = (await res.json()) as { conversation: { id: string } };
    const started = await patchConversation(
      req(`/api/conversations/${conversation.id}`, { method: "PATCH", body: { started: true } }),
      ctx(conversation.id),
    );
    expect(started.status).toBe(400);
  });
});

describe("lists hide conversations without the user's words (외부 피드백 3)", () => {
  it("onlyWithContent drops a started call with no user turn and a chat with no messages", async () => {
    const startedOnly = await newCall("work");
    await patchConversation(
      req(`/api/conversations/${startedOnly}`, { method: "PATCH", body: { started: true } }),
      ctx(startedOnly),
    );
    const emptyChat = await createConversation(
      req("/api/conversations", { body: { kind: "chat", theme: "free" } }),
      {},
    );
    const emptyChatId = ((await emptyChat.json()) as { conversation: { id: string } }).conversation
      .id;
    const spoken = await newCall("free");
    await patchConversation(
      req(`/api/conversations/${spoken}`, { method: "PATCH", body: { started: true } }),
      ctx(spoken),
    );
    await (
      await postMessage(
        req(`/api/conversations/${spoken}/messages`, { body: { content: "Hi!" } }),
        ctx(spoken),
      )
    ).text();

    const all = (await listService(userId)).map((c) => c.id);
    expect(all).toEqual(expect.arrayContaining([startedOnly, emptyChatId, spoken]));
    const shown = (await listService(userId, undefined, { onlyWithContent: true })).map(
      (c) => c.id,
    );
    expect(shown).toContain(spoken);
    expect(shown).not.toContain(startedOnly);
    expect(shown).not.toContain(emptyChatId);
  });
});
