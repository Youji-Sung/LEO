import { prisma } from "@/lib/db";

export const DEFAULT_MAX_TURNS = 60;

// 대화 1건당 사용자 턴 상한. LEO_MAX_TURNS 로 조정.
export function maxTurnsPerConversation(): number {
  const raw = Number(process.env.LEO_MAX_TURNS);
  return Number.isInteger(raw) && raw > 0 ? raw : DEFAULT_MAX_TURNS;
}

export class TurnCapError extends Error {
  constructor(public readonly limit: number) {
    super(`대화 1건당 최대 ${limit}턴까지만 가능합니다. 리포트를 생성하거나 새 대화를 시작하세요.`);
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
