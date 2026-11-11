import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { getClaudeProvider } from "@/services/claude";
import { describeClaudeError } from "@/services/claude/errors";
import { runMetered } from "@/services/claude/budget";
import { reportSchema, type Report } from "@/services/claude/schemas/report";
import type { ChatMessage, ReportInput, ThemeId } from "@/services/claude/types";
import { getOwnedConversation, toChatMessages } from "@/services/conversation";
import { errors } from "@/content/ko";
import { acquireWorkLease, assertWorkLease, type WorkLease, WORK_LEASE_MS } from "@/lib/work-lease";

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

// Only one application process owns the SQLite database in production.
// Restart recovery marks interrupted jobs, but never silently repeats a paid request.
export async function recoverInterruptedReports(sharedDatabase = false) {
  if (sharedDatabase) {
    // A new Render deployment may overlap the old process. Never invalidate its work.
    for (const job of await prisma.reportJob.findMany({ where: { status: "generating" } })) {
      await reportJobState(job.userId, job.conversationId);
    }
    await prisma.apiReservation.updateMany({ where: { status: "active", createdAt: { lt: new Date(Date.now() - 35 * 60_000) } }, data: { status: "uncertain" } });
    return;
  }
  await prisma.reportJob.updateMany({ where: { status: "generating" }, data: { status: "failed", error: "서버가 다시 시작되어 리포트 생성이 중단됐어요. 다시 만들기를 눌러 주세요." } });
  await prisma.apiReservation.updateMany({ where: { status: "active" }, data: { status: "uncertain" } });
}

export async function enqueueReport(userId: string, conversationId: string) {
  const conv = await getOwnedConversation(userId, conversationId);
  if (!conv.messages.some((m) => m.role === "user")) throw new ReportGenerationError(errors.report.empty, "empty");
  const previous = await reportJobState(userId, conversationId);
  if (previous?.status === "generating") return;
  let lease: WorkLease;
  try { lease = await acquireWorkLease(`report:${conversationId}`); }
  catch (e) { if (e instanceof HttpError && e.code === "conversation_busy") return; throw e; }
  // Claim with a single conditional write, so two same-tick POSTs cannot start two jobs.
  try {
    if (!previous) await prisma.reportJob.create({ data: { conversationId, userId, status: "generating", leaseToken: lease.token } });
    else {
      const claimed = await prisma.reportJob.updateMany({ where: { conversationId, status: { not: "generating" } }, data: { status: "generating", error: null, leaseToken: lease.token } });
      if (!claimed.count) { await lease.release(); return; }
    }
  } catch (e) {
    await lease.release();
    if ((e as { code?: string }).code === "P2002") return;
    throw e;
  }
  void generateAndSaveReport(userId, conversationId, lease)
    .then(() => prisma.reportJob.updateMany({ where: { conversationId, leaseToken: lease.token }, data: { status: "complete", error: null } }))
    .catch(async (e: unknown) => {
      const message = e instanceof HttpError || e instanceof ReportGenerationError ? e.message : "리포트를 만들지 못했어요. 다시 시도해 주세요.";
      await prisma.reportJob.updateMany({ where: { conversationId, leaseToken: lease.token }, data: { status: "failed", error: message } });
    }).finally(() => lease.release()).catch(() => console.error("Could not persist report job status"));
}

export async function reportJobState(userId: string, conversationId: string) {
  const job = await prisma.reportJob.findFirst({ where: { conversationId, userId } });
  if (job?.status === "generating") {
    const lease = job.leaseToken ? await prisma.workLease.findFirst({ where: { key: `report:${conversationId}`, token: job.leaseToken, expiresAt: { gt: new Date() } } }) : null;
    if (!lease && (job.leaseToken || job.updatedAt.getTime() < Date.now() - WORK_LEASE_MS)) {
      await prisma.reportJob.updateMany({ where: { conversationId, userId, status: "generating", leaseToken: job.leaseToken }, data: { status: "failed", error: "서버 연결이 중단되어 리포트를 완료하지 못했어요. 다시 만들기를 눌러 주세요." } });
      return prisma.reportJob.findFirst({ where: { conversationId, userId } });
    }
  }
  return job;
}

// 생성 중인 동일 입력만 공유한다. 완료·실패 후에는 제거해 명시적 재생성과 재시도를 유지한다.
const pendingReports = new Map<string, { userId: string; conversationId: string; work: Promise<SavedReport> }>();

// 소유권을 확인한 GET에서만 사용한다. 상태 조회는 모델을 호출하지 않는다.
export function isReportGenerating(userId: string, conversationId: string): boolean {
  return [...pendingReports.values()].some((job) => job.userId === userId && job.conversationId === conversationId);
}

export async function generateAndSaveReport(userId: string, conversationId: string, lease?: WorkLease): Promise<SavedReport> {
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
  const key = createHash("sha256").update(JSON.stringify([userId, conversationId, input, lease?.token])).digest("hex");
  const pending = pendingReports.get(key);
  if (pending) return pending.work;

  const work = generateAndSaveSnapshot(conv, input, lease);
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
  lease?: WorkLease,
): Promise<SavedReport> {
  const userId = conv.userId;
  const conversationId = conv.id;
  const provider = getClaudeProvider();
  let result: Awaited<ReturnType<typeof provider.generateReport>>;
  try {
    if (lease) await assertWorkLease(lease);
    result = await runMetered(userId, "report", input, () => provider.generateReport(input));
  } catch (e) {
    if (e instanceof HttpError) throw e;
    console.error("generateReport failed", e);
    throw new ReportGenerationError(errors.report.provider(describeClaudeError(e)), "provider");
  }
  if (result.stopReason === "refusal") {
    throw new ReportGenerationError(errors.report.refusal, "refusal");
  }
  if (!result.report) {
    // 파싱 오류 내용은 사용자에게 보이지 않게 로그에만 남긴다.
    console.error("report parse failed", result.parseError);
    throw new ReportGenerationError(errors.report.invalid, "invalid");
  }
  const saved = await prisma.$transaction(async (tx) => {
    if (lease) await assertWorkLease(lease, tx);
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
