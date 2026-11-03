import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { getClaudeProvider } from "@/services/claude";
import { assertTurnAllowed, TurnCapError } from "@/services/claude/turn-cap";
import { recordUsage } from "@/services/claude/usage";
import type { ChatMessage, ConversationMode, ThemeId } from "@/services/claude/types";
import { THEME_IDS } from "@/services/claude/types";

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
    const pf = await prisma.portfolio.findFirst({ where: { id: input.portfolioId, userId: input.userId } });
    if (!pf) throw new HttpError(404, "포트폴리오를 찾을 수 없습니다.", "portfolio_not_found");
  }
  if (input.theme === "portfolio" && !input.portfolioId) {
    throw new HttpError(400, "포트폴리오 면접 테마는 포트폴리오를 골라야 합니다.", "portfolio_required");
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
  if (!conv) throw new HttpError(404, "대화를 찾을 수 없습니다.", "conversation_not_found");
  return conv;
}

export async function updateConversation(
  userId: string,
  id: string,
  patch: { hintsEnabled?: boolean; title?: string; endedAt?: Date | null; durationSec?: number },
) {
  await getOwnedConversation(userId, id);
  return prisma.conversation.update({ where: { id }, data: patch });
}

export function toChatMessages(messages: Array<{ role: string; content: string }>): ChatMessage[] {
  return messages
    .filter((m): m is { role: "user" | "assistant"; content: string } => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));
}

export type StreamEvent =
  | { type: "delta"; text: string }
  | { type: "done"; message: { id: string; role: "assistant"; content: string; hint: string | null; index: number }; stopReason: string }
  | { type: "error"; message: string; code: string };

// 사용자 메시지를 저장하고 Claude 응답을 스트리밍 이벤트로 돌려준다. 호출자가 이벤트를 그대로 클라이언트에 흘려보낸다.
export async function* sendMessage(input: { userId: string; conversationId: string; content: string }): AsyncGenerator<StreamEvent> {
  const conv = await getOwnedConversation(input.userId, input.conversationId);
  if (conv.endedAt) throw new HttpError(409, "이미 종료된 대화입니다.", "conversation_ended");
  const content = input.content.trim();
  if (!content) throw new HttpError(400, "메시지를 입력하세요.", "empty_message");
  if (content.length > 4000) throw new HttpError(400, "메시지가 너무 깁니다 (4000자 이하).", "message_too_long");

  try {
    await assertTurnAllowed(conv.id);
  } catch (e) {
    if (e instanceof TurnCapError) throw new HttpError(429, e.message, "turn_cap");
    throw e;
  }

  const history = toChatMessages(conv.messages);
  const nextIndex = conv.messages.length;
  const userMessage = await prisma.message.create({
    data: { conversationId: conv.id, role: "user", content, index: nextIndex },
  });
  const titlePatch = conv.title ? {} : { title: content.slice(0, 40) };
  await prisma.conversation.update({ where: { id: conv.id }, data: { ...titlePatch } });

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
    await recordUsage({ userId: input.userId, feature: mode === "call" ? "call" : "chat", model: r.model, usage: r.usage, latencyMs: r.latencyMs });
    if (r.stopReason === "refusal") {
      push({ type: "error", message: "상대가 이 주제에는 답하지 않기로 했습니다. 다른 주제로 대화를 이어가 보세요.", code: "refusal" });
      return;
    }
    const assistant = await prisma.message.create({
      data: { conversationId: conv.id, role: "assistant", content: r.text, hint: r.hint, index: userMessage.index + 1 },
    });
    push({
      type: "done",
      message: { id: assistant.id, role: "assistant", content: assistant.content, hint: assistant.hint, index: assistant.index },
      stopReason: r.stopReason,
    });
  };

  void work()
    .catch((e: unknown) => {
      console.error("chatTurn failed", e);
      push({ type: "error", message: describeProviderError(e), code: "provider_error" });
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

export function describeProviderError(e: unknown): string {
  const name = e instanceof Error ? e.name : "";
  const msg = e instanceof Error ? e.message : String(e);
  if (name === "ClaudeConfigError") return "Claude API 키가 설정되지 않았습니다. 운영자가 LEO_ANTHROPIC_API_KEY 를 설정해야 합니다.";
  if (name === "AuthenticationError") return "Claude API 키가 올바르지 않습니다. 운영자에게 알려 주세요.";
  if (name === "RateLimitError") return "Claude API 사용량 한도에 걸렸습니다. 잠시 후 다시 시도하세요.";
  if (name === "APIConnectionError" || name === "APIConnectionTimeoutError") return "Claude API 에 연결하지 못했습니다. 네트워크를 확인하고 다시 시도하세요.";
  if (/ECONNREFUSED|ENOTFOUND|fetch failed|network/i.test(msg)) return "네트워크 오류가 발생했습니다. 다시 시도하세요.";
  return "응답을 받지 못했습니다. 다시 시도하세요.";
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
        const status = e instanceof HttpError ? e.code ?? "error" : "internal";
        const message = e instanceof HttpError ? e.message : "서버 오류가 발생했습니다.";
        if (!(e instanceof HttpError)) console.error(e);
        controller.enqueue(encoder.encode(`${JSON.stringify({ type: "error", message, code: status })}\n`));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(body, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
