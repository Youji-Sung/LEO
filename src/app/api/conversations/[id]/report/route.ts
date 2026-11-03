import type { NextRequest } from "next/server";
import { errorResponse, handler, requireRequestUser } from "@/lib/http";
import { generateAndSaveReport, getOwnedReport, ReportGenerationError } from "@/services/report";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handler(async (req: NextRequest, ctx: Ctx) => {
  const user = await requireRequestUser(req);
  const { id } = await ctx.params;
  try {
    const { report } = await generateAndSaveReport(user.id, id);
    return Response.json({ report });
  } catch (e) {
    if (e instanceof ReportGenerationError) {
      const status = e.code === "empty" ? 400 : e.code === "invalid" ? 502 : e.code === "refusal" ? 422 : 502;
      return errorResponse(status, e.message, `report_${e.code}`);
    }
    throw e;
  }
});

export const GET = handler(async (req: NextRequest, ctx: Ctx) => {
  const user = await requireRequestUser(req);
  const { id } = await ctx.params;
  const { report } = await getOwnedReport(user.id, id);
  if (!report) return errorResponse(404, "리포트가 아직 없습니다.", "report_not_found");
  return Response.json({ report });
});
