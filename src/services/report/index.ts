import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { getClaudeProvider } from "@/services/claude";
import { describeClaudeError } from "@/services/claude/errors";
import { recordUsage } from "@/services/claude/usage";
import { reportSchema, type Report } from "@/services/claude/schemas/report";
import type { ChatMessage, ReportInput, ThemeId } from "@/services/claude/types";
import { getOwnedConversation, toChatMessages } from "@/services/conversation";
import { errors } from "@/content/ko";

// 리포트 입력 상한. Opus 5 의 1M 컨텍스트에 비해 통화 1회(최대 60턴)는 아주 작으므로 전체를 넣되,
// 비정상적으로 긴 경우만 오래된 턴부터 잘라 낸다(DECISIONS 참고).
export const REPORT_MAX_TRANSCRIPT_CHARS = 120_000;

export function trimTranscript(messages: ChatMessage[], maxChars = REPORT_MAX_TRANSCRIPT_CHARS): { transcript: ChatMessage[]; trimmed: number } {
  let total = messages.reduce((n, m) => n + m.content.length, 0);
  let start = 0;
  while (total > maxChars && start < messages.length - 2) {
    total -= messages[start]!.content.length;
    start++;
  }
  return { transcript: messages.slice(start), trimmed: start };
}

export class ReportGenerationError extends Error {
  constructor(
    message: string,
    public readonly code: "empty" | "refusal" | "invalid" | "provider",
  ) {
    super(message);
    this.name = "ReportGenerationError";
  }
}

type SavedReport = { id: string; report: Report };

// 생성 중인 동일 입력만 공유한다. 완료·실패 후에는 제거해 명시적 재생성과 재시도를 유지한다.
const pendingReports = new Map<string, { userId: string; conversationId: string; work: Promise<SavedReport> }>();

// 소유권을 확인한 GET에서만 사용한다. 상태 조회는 모델을 호출하지 않는다.
export function isReportGenerating(userId: string, conversationId: string): boolean {
  return [...pendingReports.values()].some((job) => job.userId === userId && job.conversationId === conversationId);
}

export async function generateAndSaveReport(userId: string, conversationId: string): Promise<SavedReport> {
  const conv = await getOwnedConversation(userId, conversationId);
  const messages = toChatMessages(conv.messages);
  if (!messages.some((m) => m.role === "user")) {
    throw new ReportGenerationError(errors.report.empty, "empty");
  }
  const { transcript } = trimTranscript(messages);
  const input: ReportInput = {
    theme: conv.theme as ThemeId,
    mode: conv.kind === "call" ? "call" : "chat",
    transcript,
    portfolioText: conv.portfolio?.content ?? null,
  };
  const key = createHash("sha256").update(JSON.stringify([userId, conversationId, input])).digest("hex");
  const pending = pendingReports.get(key);
  if (pending) return pending.work;

  const work = generateAndSaveSnapshot(conv, input);
  pendingReports.set(key, { userId, conversationId, work });
  try {
    return await work;
  } finally {
    if (pendingReports.get(key)?.work === work) pendingReports.delete(key);
  }
}

async function generateAndSaveSnapshot(
  conv: Awaited<ReturnType<typeof getOwnedConversation>>,
  input: ReportInput,
): Promise<SavedReport> {
  const userId = conv.userId;
  const conversationId = conv.id;
  const provider = getClaudeProvider();
  let result: Awaited<ReturnType<typeof provider.generateReport>>;
  try {
    result = await provider.generateReport(input);
  } catch (e) {
    console.error("generateReport failed", e);
    throw new ReportGenerationError(errors.report.provider(describeClaudeError(e)), "provider");
  }
  await recordUsage({ userId, feature: "report", model: result.model, usage: result.usage, latencyMs: result.latencyMs });
  if (result.stopReason === "refusal") {
    throw new ReportGenerationError(errors.report.refusal, "refusal");
  }
  if (!result.report) {
    // 파싱 오류 내용은 사용자에게 보이지 않게 로그에만 남긴다.
    console.error("report parse failed", result.parseError);
    throw new ReportGenerationError(errors.report.invalid, "invalid");
  }
  const saved = await prisma.$transaction(async (tx) => {
    const rep = await tx.report.upsert({
      where: { conversationId },
      update: { json: JSON.stringify(result.report) },
      create: { conversationId, json: JSON.stringify(result.report) },
    });
    if (!conv.endedAt) await tx.conversation.update({ where: { id: conversationId }, data: { endedAt: new Date() } });
    return rep;
  });
  return { id: saved.id, report: result.report };
}

export async function getOwnedReport(userId: string, conversationId: string) {
  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    include: { report: true, messages: { orderBy: { index: "asc" } }, portfolio: { select: { id: true, title: true } } },
  });
  if (!conv) throw new HttpError(404, errors.conversation.notFound, "conversation_not_found");
  if (!conv.report) return { conversation: conv, report: null };
  const parsed = reportSchema.safeParse(JSON.parse(conv.report.json));
  return { conversation: conv, report: parsed.success ? parsed.data : null };
}
