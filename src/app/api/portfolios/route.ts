import type { NextRequest } from "next/server";
import { z } from "zod";
import { handler, HttpError, parseBody, requireRequestUser } from "@/lib/http";
import { createPortfolio, extractPdfText, listPortfolios, PORTFOLIO_PDF_MAX_BYTES } from "@/services/portfolio";

const jsonSchema = z.object({ title: z.string().max(100), content: z.string().max(200_000) });

export const GET = handler(async (req: NextRequest) => {
  const user = await requireRequestUser(req);
  const list = await listPortfolios(user.id);
  return Response.json({
    portfolios: list.map((p) => ({ id: p.id, title: p.title, createdAt: p.createdAt, chars: p.content.length, preview: p.content.slice(0, 200) })),
  });
});

// JSON(텍스트/마크다운) 또는 multipart(PDF 파일 `file` + `title`) 둘 다 받는다.
export const POST = handler(async (req: NextRequest) => {
  const user = await requireRequestUser(req);
  const contentType = req.headers.get("content-type") ?? "";
  let title: string;
  let content: string;
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    title = String(form.get("title") ?? "");
    if (!(file instanceof File)) throw new HttpError(400, "PDF 파일을 선택하세요.", "file_required");
    if (file.size > PORTFOLIO_PDF_MAX_BYTES) throw new HttpError(400, "PDF 는 10MB 이하여야 합니다.", "file_too_large");
    if (!/pdf$/i.test(file.type) && !/\.pdf$/i.test(file.name)) throw new HttpError(400, "PDF 파일만 올릴 수 있습니다.", "not_pdf");
    try {
      content = await extractPdfText(new Uint8Array(await file.arrayBuffer()));
    } catch (e) {
      console.error("pdf extract failed", e);
      throw new HttpError(400, "PDF 에서 텍스트를 추출하지 못했습니다. 텍스트로 붙여넣어 주세요.", "pdf_extract_failed");
    }
    if (!content) throw new HttpError(400, "PDF 에 추출할 텍스트가 없습니다(스캔 이미지일 수 있음). 텍스트로 붙여넣어 주세요.", "pdf_no_text");
    if (!title.trim()) title = file.name.replace(/\.pdf$/i, "");
  } else {
    const body = await parseBody(req, jsonSchema);
    title = body.title;
    content = body.content;
  }
  const pf = await createPortfolio(user.id, { title, content });
  return Response.json({ portfolio: { id: pf.id, title: pf.title, createdAt: pf.createdAt, chars: pf.content.length } }, { status: 201 });
});
