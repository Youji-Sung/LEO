import { prisma } from "@/lib/db";
import { errors } from "@/content/ko";

export const DEFAULT_MAX_TURNS = 60;

// 대화 1건당 사용자 턴 상한. LEO_MAX_TURNS 로 조정.
export function maxTurnsPerConversation(): number {
  const raw = Number(process.env.LEO_MAX_TURNS);
  return Number.isInteger(raw) && raw > 0 ? raw : DEFAULT_MAX_TURNS;
}

export class TurnCapError extends Error {
  constructor(public readonly limit: number) {
    super(errors.conversation.turnCap(limit));
    this.name = "TurnCapError";
  }
}

export async function countUserTurns(conversationId: string): Promise<number> {
  return prisma.message.count({ where: { conversationId, role: "user" } });
}

export async function assertTurnAllowed(conversationId: string, limit = maxTurnsPerConversation()): Promise<void> {
  const used = await countUserTurns(conversationId);
  if (used >= limit) throw new TurnCapError(limit);
}
