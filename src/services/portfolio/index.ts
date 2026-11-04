import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { errors } from "@/content/ko";

export const PORTFOLIO_MAX_CHARS = 60_000;
export const PORTFOLIO_PDF_MAX_BYTES = 10 * 1024 * 1024;

export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  // unpdf 는 네이티브 의존성이 없는 PDF.js 서버리스 빌드를 쓴다.
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizePortfolioContent(content: string): string {
  const trimmed = content.replace(/\r\n/g, "\n").trim();
  if (!trimmed) throw new HttpError(400, errors.portfolio.emptyContent, "empty_content");
  if (trimmed.length > PORTFOLIO_MAX_CHARS) {
    throw new HttpError(400, errors.portfolio.tooLong(PORTFOLIO_MAX_CHARS.toLocaleString("ko-KR")), "content_too_long");
  }
  return trimmed;
}

export async function createPortfolio(userId: string, input: { title: string; content: string }) {
  const title = input.title.trim();
  if (!title) throw new HttpError(400, errors.portfolio.emptyTitle, "empty_title");
  return prisma.portfolio.create({
    data: { userId, title: title.slice(0, 100), content: normalizePortfolioContent(input.content) },
  });
}

export async function listPortfolios(userId: string) {
  return prisma.portfolio.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, createdAt: true, content: true },
  });
}

export async function deletePortfolio(userId: string, id: string) {
  const pf = await prisma.portfolio.findFirst({ where: { id, userId } });
  if (!pf) throw new HttpError(404, errors.portfolio.notFound, "portfolio_not_found");
  const live = await prisma.conversation.count({ where: { portfolioId: id, endedAt: null } });
  if (live > 0) throw new HttpError(409, errors.portfolio.inUse, "portfolio_in_use");
  await prisma.portfolio.delete({ where: { id } });
}
