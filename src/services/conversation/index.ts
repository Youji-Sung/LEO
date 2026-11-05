import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { getClaudeProvider } from "@/services/claude";
import { describeClaudeError } from "@/services/claude/errors";
import { assertTurnAllowed, TurnCapError } from "@/services/claude/turn-cap";
import { recordUsage } from "@/services/claude/usage";
import type { ChatMessage, ConversationMode, ThemeId } from "@/services/claude/types";
import { THEME_IDS } from "@/services/claude/types";
import { errors } from "@/content/ko";

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

export async function listConversations(userId: string, kind?: ConversationKind) {
  return prisma.conversation.findMany({
    where: { userId, ...(kind ? { kind } : {}) },
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

// 같은 대화에 대한 동시 전송을 직렬화한다(단일 프로세스). 메시지 index 충돌과 턴 상한 우회를 막는다.
const conversationLocks = new Map<string, Promise<void>>();
async function acquireConversationLock(id: string): Promise<() => void> {
  const previous = conversationLocks.get(id) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chained = previous.then(() => current);
  conversationLocks.set(id, chained);
  await previous;
  return () => {
    release();
    if (conversationLocks.get(id) === chained) conversationLocks.delete(id);
  };
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
  const unlock = () => {
    if (locked) release();
    locked = false;
  };
  try {
    yield* sendMessageLocked(input);
  } finally {
    unlock();
  }
}

async function* sendMessageLocked(input: {
  userId: string;
  conversationId: string;
  content: string;
}): AsyncGenerator<StreamEvent> {
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

  const history = toChatMessages(conv.messages);
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
    const r = await provider.chatTurn(
      {
        theme: conv.theme as ThemeId,
        mode,
        hints: conv.hintsEnabled,
        portfolioText: conv.portfolio?.content ?? null,
        messages: [...history, { role: "user", content }],
      },
      (text) => push({ type: "delta", text }),
    );
    await recordUsage({
      userId: input.userId,
      feature: mode === "call" ? "call" : "chat",
      model: r.model,
      usage: r.usage,
      latencyMs: r.latencyMs,
    });
    if (r.stopReason === "refusal") {
      await dropUserTurn();
      push({ type: "error", message: errors.conversation.refusal, code: "refusal" });
      return;
    }
    const assistant = await prisma.message.create({
      data: {
        conversationId: conv.id,
        role: "assistant",
        content: r.text,
        hint: r.hint,
        index: userMessage.index + 1,
      },
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

  void work()
    .catch(async (e: unknown) => {
      console.error("chatTurn failed", e);
      await dropUserTurn();
      push({ type: "error", message: describeClaudeError(e), code: "provider_error" });
    })
    .finally(() => {
      finished = true;
      wakeUp?.();
      wakeUp = null;
    });

  while (true) {
    while (queue.length > 0) yield queue.shift()!;
    if (finished) break;
    await new Promise<void>((resolve) => {
      wakeUp = resolve;
    });
  }
}

export function streamEventsToResponse(events: AsyncIterable<StreamEvent>): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const ev of events) {
          controller.enqueue(encoder.encode(`${JSON.stringify(ev)}\n`));
        }
      } catch (e) {
        const status = e instanceof HttpError ? (e.code ?? "error") : "internal";
        const message = e instanceof HttpError ? e.message : errors.internal;
        if (!(e instanceof HttpError)) console.error(e);
        controller.enqueue(
          encoder.encode(`${JSON.stringify({ type: "error", message, code: status })}\n`),
        );
      } finally {
        controller.close();
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
