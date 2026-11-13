import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/http-error";
import { reportSchema } from "@/services/claude/schemas/report";
import { containsExpression, nextLearningState, type LearningCard } from "@/lib/learning";
import { readSpeech, uncertainSpeech } from "@/lib/transcription";
import { reportEvidence } from "@/services/report/evidence";

export async function listLearning(userId: string): Promise<LearningCard[]> {
  const rows = await prisma.learningItem.findMany({
    where: { userId },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    take: 200,
  });
  return rows.map((row) => ({
    ...row,
    dueAt: row.dueAt.toISOString(),
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
  }));
}
export async function saveLearning(
  userId: string,
  conversationId: string,
  kind: "vocabulary" | "expression",
  index: number,
) {
  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    include: { report: true, messages: true },
  });
  if (!conv?.report) throw new HttpError(404, "리포트를 찾지 못했어요.", "report_not_found");
  const parsed = reportSchema.safeParse(JSON.parse(conv.report.json));
  if (!parsed.success) throw new HttpError(409, "리포트를 다시 확인해 주세요.", "report_invalid");
  const safe = reportEvidence(parsed.data, conv.kind, conv.messages).report;
  const v = safe.vocabularySuggestions[index],
    b = safe.betterExpressions[index];
  const item =
    kind === "vocabulary" && v
      ? { phrase: v.better, original: v.original, explanation: v.meaning, example: v.example }
      : kind === "expression" && b
        ? {
            phrase: b.native,
            original: b.original,
            explanation:
              "같은 뜻을 다른 상황에서도 표현해 봐요. 원래 대화의 의미와 예문을 비교해 보세요.",
            example: b.native,
          }
        : null;
  if (!item || !item.phrase.trim() || item.phrase.length > 1000)
    throw new HttpError(400, "학습할 표현을 다시 선택해 주세요.", "invalid_expression");
  const sources = conv.messages.filter(
    (m) => m.role === "user" && containsExpression(m.content, item.original),
  );
  if (
    !sources.length ||
    (conv.kind === "call" &&
      sources.every((m) => uncertainSpeech(m.content, readSpeech(m.speech)).length))
  ) {
    throw new HttpError(
      409,
      "원문 또는 음성 인식을 먼저 확인해야 하는 표현이에요.",
      "unverified_expression",
    );
  }
  const sourceKey = createHash("sha256")
    .update(JSON.stringify([conversationId, item.original, item.phrase]))
    .digest("hex");
  return prisma.learningItem.upsert({
    where: { userId_sourceKey: { userId, sourceKey } },
    update: {},
    create: { userId, sourceConversationId: conversationId, sourceKey, ...item },
  });
}
export async function reviewLearning(
  userId: string,
  id: string,
  input: { outcome: "again" | "hint" | "ready"; answer: string; version: number },
) {
  const item = await prisma.learningItem.findFirst({ where: { id, userId } });
  if (!item) throw new HttpError(404, "학습 표현을 찾지 못했어요.", "learning_not_found");
  const state = nextLearningState(item.stage, item.reviewCount, input.outcome);
  const updated = await prisma.learningItem.updateMany({
    where: { id, userId, reviewCount: input.version },
    data: {
      ...state,
      reviewCount: { increment: 1 },
      lastAnswer: input.answer,
      lastOutcome: input.outcome,
    },
  });
  if (!updated.count)
    throw new HttpError(
      409,
      "다른 화면에서 학습이 갱신됐어요. 새로고침해 주세요.",
      "learning_changed",
    );
}
export async function learningSnapshot(userId: string, ids: string[]) {
  if (!ids.length) return [];
  if (ids.length > 3)
    throw new HttpError(400, "표현은 한 번에 3개까지 골라 주세요.", "too_many_expressions");
  const unique = [...new Set(ids)];
  const rows = await prisma.learningItem.findMany({
    where: { userId, id: { in: unique } },
    select: { id: true, phrase: true, explanation: true },
  });
  if (rows.length !== unique.length)
    throw new HttpError(404, "학습 표현을 찾지 못했어요.", "learning_not_found");
  return rows;
}
export async function recordLearningUse(
  userId: string,
  conversationId: string,
  snapshot: string,
  text: string,
) {
  const targets: Array<{ id: string; phrase: string }> = JSON.parse(snapshot);
  const ids = targets
    .filter((target) => containsExpression(text, target.phrase))
    .map((target) => target.id);
  if (ids.length)
    await prisma.learningItem.updateMany({
      where: { userId, id: { in: ids } },
      data: { lastUsedAt: new Date(), lastUseConversationId: conversationId, lastUseText: text },
    });
}
