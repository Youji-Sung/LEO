import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/http";
import type { Prisma } from "@/generated/prisma/client";
import { getClaudeProvider } from "@/services/claude";
import { describeClaudeError } from "@/services/claude/errors";
import { assertTurnAllowed, TurnCapError } from "@/services/claude/turn-cap";
import { runMetered } from "@/services/claude/budget";
import type { ChatMessage, ChatTurnInput, ConversationMode, ThemeId } from "@/services/claude/types";
import { THEME_IDS } from "@/services/claude/types";
import { errors } from "@/content/ko";
import { hintForMessage } from "@/services/claude/hint-splitter";
import { acquireWorkLease, assertWorkLease, type WorkLease } from "@/lib/work-lease";

export type ConversationKind = ConversationMode;

export function isThemeId(v: string): v is ThemeId {
  return (THEME_IDS as readonly string[]).includes(v);
}

export async function createConversation(input: {
  userId: string;
  kind: ConversationKind;
  theme: ThemeId;
  hintsEnabled?: boolean;
  durationSec?: number | null;
  portfolioId?: string | null;
}) {
  if (input.portfolioId) {
    const pf = await prisma.portfolio.findFirst({
      where: { id: input.portfolioId, userId: input.userId },
    });
    if (!pf) throw new HttpError(404, errors.portfolio.notFound, "portfolio_not_found");
  }
  if (input.theme === "portfolio" && !input.portfolioId) {
    throw new HttpError(400, errors.conversation.portfolioRequired, "portfolio_required");
  }
  let hintsEnabled = input.hintsEnabled;
  if (hintsEnabled === undefined) {
    const settings = await prisma.userSettings.findUnique({ where: { userId: input.userId } });
    hintsEnabled = settings?.hintsDefault ?? false;
  }
  return prisma.conversation.create({
    data: {
      userId: input.userId,
      kind: input.kind,
      theme: input.theme,
      hintsEnabled,
      durationSec: input.durationSec ?? null,
      portfolioId: input.portfolioId ?? null,
    },
  });
}

export async function listConversations(
  userId: string,
  kind?: ConversationKind,
  options: { onlyWithContent?: boolean } = {},
) {
  return prisma.conversation.findMany({
    where: {
      userId,
      ...(kind ? { kind } : {}),
      ...(options.onlyWithContent ? hasContentWhere : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } }, report: { select: { id: true } } },
  });
}

export async function getOwnedConversation(userId: string, id: string) {
  const conv = await prisma.conversation.findFirst({
    where: { id, userId },
    include: {
      messages: { orderBy: { index: "asc" } },
      report: { select: { id: true, createdAt: true } },
      portfolio: { select: { id: true, title: true, content: true } },
    },
  });
  if (!conv) throw new HttpError(404, errors.conversation.notFound, "conversation_not_found");
  return conv;
}

export async function updateConversation(
  userId: string,
  id: string,
  patch: {
    hintsEnabled?: boolean;
    title?: string;
    endedAt?: Date | null;
    startedAt?: Date;
    durationSec?: number;
  },
) {
  await getOwnedConversation(userId, id);
  return prisma.conversation.update({ where: { id }, data: patch });
}

// 첫 메시지로 제목을 만든다. 40자를 넘으면 단어 경계에서 자르고 말줄임표를 붙인다.
export function makeTitle(content: string, max = 40): string {
  const text = content.trim().replace(/\s+/g, " ");
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace >= max / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function toChatMessages(messages: Array<{ role: string; content: string }>): ChatMessage[] {
  return messages
    .filter(
      (m): m is { role: "user" | "assistant"; content: string } =>
        m.role === "user" || m.role === "assistant",
    )
    .map((m) => ({ role: m.role, content: m.content }));
}

// Claude API 로 보낼 히스토리. 첫 메시지는 user 여야 하므로 앞에 저장된 상대의 첫 인사(assistant)는 뺀다.
export function toProviderMessages(messages: ChatMessage[]): ChatMessage[] {
  const first = messages.findIndex((m) => m.role === "user");
  return first < 0 ? [] : messages.slice(first);
}

// 통화 시작: 시작 시각을 기록하고 상대의 첫 인사를 첫 메시지(index 0)로 저장한다.
// 첫 인사는 리포트·대화 내용·메시지 수에 들어가고, API 히스토리에서는 toProviderMessages 가 뺀다.
export async function startCall(userId: string, id: string, openingLine: string) {
  const release = await acquireConversationLock(id);
  try {
    const conv = await getOwnedConversation(userId, id);
    if (conv.kind !== "call") throw new HttpError(400, errors.conversation.notACall, "not_a_call");
    if (conv.endedAt) throw new HttpError(409, errors.conversation.callEnded, "call_ended");
    // 이미 시작한 통화(메시지가 있음)는 시작 시각을 바꾸지 않는다.
    if (conv.messages.length > 0) return conv;
    await prisma.message.create({
      data: { conversationId: id, role: "assistant", content: openingLine, index: 0 },
    });
    return prisma.conversation.update({ where: { id }, data: { startedAt: new Date() } });
  } finally {
    await release();
  }
}

// 목록·홈에 보일 대화: 내가 한 말이 하나라도 있거나 리포트가 있는 것. 만들기만 하고 말하지 않은 대화는 숨긴다.
export const hasContentWhere: Prisma.ConversationWhereInput = {
  OR: [{ messages: { some: { role: "user" } } }, { report: { isNot: null } }],
};

// 같은 대화에 대한 동시 전송을 직렬화한다(단일 프로세스). 메시지 index 충돌과 턴 상한 우회를 막는다.
const conversationLocks = new Map<string, Promise<void>>();
type ConversationRelease = (() => Promise<void>) & { lease?: WorkLease };
async function acquireConversationLock(id: string): Promise<ConversationRelease> {
  const previous = conversationLocks.get(id) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chained = previous.then(() => current);
  conversationLocks.set(id, chained);
  await previous;
  const releaseLocal = () => {
    release();
    if (conversationLocks.get(id) === chained) conversationLocks.delete(id);
  };
  let lease: WorkLease | undefined;
  try {
    if (process.env.LEO_DEPLOYMENT_PROFILE === "render-free" || /^(libsql|https):/.test(process.env.DATABASE_URL || "")) lease = await acquireWorkLease(`conversation:${id}`);
  } catch (e) { releaseLocal(); throw e; }
  const done: ConversationRelease = async () => {
    try { if (lease) await lease.release(); } finally { releaseLocal(); }
  };
  done.lease = lease;
  return done;
}

export type StreamEvent =
  | { type: "delta"; text: string }
  | {
      type: "done";
      message: {
        id: string;
        role: "assistant";
        content: string;
        hint: string | null;
        index: number;
      };
      stopReason: string;
    }
  | { type: "error"; message: string; code: string };

// 사용자 메시지를 저장하고 Claude 응답을 스트리밍 이벤트로 돌려준다. 호출자가 이벤트를 그대로 클라이언트에 흘려보낸다.
export async function* sendMessage(input: {
  userId: string;
  conversationId: string;
  content: string;
}): AsyncGenerator<StreamEvent> {
  const release = await acquireConversationLock(input.conversationId);
  let locked = true;
  const unlock = async () => {
    if (locked) await release();
    locked = false;
  };
  try {
    yield* sendMessageLocked(input, release.lease);
  } finally {
    await unlock();
  }
}

async function* sendMessageLocked(input: {
  userId: string;
  conversationId: string;
  content: string;
}, lease?: WorkLease): AsyncGenerator<StreamEvent> {
  const conv = await getOwnedConversation(input.userId, input.conversationId);
  if (conv.endedAt) throw new HttpError(409, errors.conversation.ended, "conversation_ended");
  const content = input.content.trim();
  if (!content) throw new HttpError(400, errors.conversation.emptyMessage, "empty_message");
  if (content.length > 4000) throw new HttpError(400, errors.conversation.tooLong, "message_too_long");

  try {
    await assertTurnAllowed(conv.id);
  } catch (e) {
    if (e instanceof TurnCapError) throw new HttpError(429, e.message, "turn_cap");
    throw e;
  }

  const history = toProviderMessages(toChatMessages(conv.messages));
  const lastIndex = conv.messages.length > 0 ? conv.messages[conv.messages.length - 1]!.index : -1;
  const userMessage = await prisma.message.create({
    data: { conversationId: conv.id, role: "user", content, index: lastIndex + 1 },
  });
  const titleFromThisTurn = !conv.title;
  if (titleFromThisTurn)
    await prisma.conversation.update({
      where: { id: conv.id },
      data: { title: makeTitle(content) },
    });
  // 응답을 받지 못한 사용자 턴은 지워서 턴 상한과 다음 호출 히스토리에 남지 않게 한다(클라이언트가 같은 내용으로 재시도한다).
  // 이 턴으로 붙인 제목도 같이 되돌린다.
  const dropUserTurn = async () => {
    await prisma.message.delete({ where: { id: userMessage.id } }).catch(() => undefined);
    if (titleFromThisTurn)
      await prisma.conversation
        .update({ where: { id: conv.id }, data: { title: null } })
        .catch(() => undefined);
  };

  const provider = getClaudeProvider();
  const mode: ConversationMode = conv.kind === "call" ? "call" : "chat";

  // 클라이언트가 중간에 끊어도 응답 저장과 사용량 기록은 끝까지 진행되도록, 작업은 큐에 이벤트를 밀어 넣고 제너레이터는 큐만 비운다.
  const queue: StreamEvent[] = [];
  let finished = false;
  let wakeUp: (() => void) | null = null;
  const push = (ev: StreamEvent) => {
    queue.push(ev);
    wakeUp?.();
    wakeUp = null;
  };

  const work = async () => {
    const request: ChatTurnInput = {
        theme: conv.theme as ThemeId,
        mode,
        hints: conv.hintsEnabled,
        portfolioText: conv.portfolio?.content ?? null,
        messages: [...history, { role: "user", content }],
      };
    if (lease) await assertWorkLease(lease);
    const r = await runMetered(input.userId, mode, request, () => provider.chatTurn(request, (text) => push({ type: "delta", text })));
    if (r.stopReason === "refusal") {
      await dropUserTurn();
      push({ type: "error", message: errors.conversation.refusal, code: "refusal" });
      return;
    }
    const assistant = await prisma.$transaction(async (tx) => {
      if (lease) await assertWorkLease(lease, tx);
      return tx.message.create({
      data: {
        conversationId: conv.id,
        role: "assistant",
        content: r.text,
        hint: conv.hintsEnabled ? hintForMessage(r.hint, content) : null,
        index: userMessage.index + 1,
      },
      });
    });
    push({
      type: "done",
      message: {
        id: assistant.id,
        role: "assistant",
        content: assistant.content,
        hint: assistant.hint,
        index: assistant.index,
      },
      stopReason: r.stopReason,
    });
  };

  const workPromise = work()
    .catch(async (e: unknown) => {
      console.error("chatTurn failed", e);
      await dropUserTurn();
      push({ type: "error", message: e instanceof HttpError ? e.message : describeClaudeError(e), code: e instanceof HttpError ? e.code || "error" : "provider_error" });
    })
    .finally(() => {
      finished = true;
      wakeUp?.();
      wakeUp = null;
    });

  try {
    while (true) {
      while (queue.length > 0) yield queue.shift()!;
      if (finished) break;
      await new Promise<void>((resolve) => { wakeUp = resolve; });
    }
  } finally { await workPromise; }
}

export function streamEventsToResponse(events: AsyncIterable<StreamEvent>): Response {
  const encoder = new TextEncoder();
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    cancel() { cancelled = true; },
    async start(controller) {
      try {
        for await (const ev of events) {
          if (!cancelled) controller.enqueue(encoder.encode(`${JSON.stringify(ev)}\n`));
        }
      } catch (e) {
        const status = e instanceof HttpError ? (e.code ?? "error") : "internal";
        const message = e instanceof HttpError ? e.message : errors.internal;
        if (!(e instanceof HttpError)) console.error(e);
        if (!cancelled) controller.enqueue(
          encoder.encode(`${JSON.stringify({ type: "error", message, code: status })}\n`),
        );
      } finally {
        if (!cancelled) controller.close();
      }
    },
  });
  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
