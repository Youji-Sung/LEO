import type { NextRequest } from "next/server";
import { errorResponse, handler, requireRequestUser } from "@/lib/http";
import { enqueueReport, getOwnedReport, isReportGenerating, reportJobState, ReportGenerationError } from "@/services/report";
import { errors } from "@/content/ko";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handler(async (req: NextRequest, ctx: Ctx) => {
  const user = await requireRequestUser(req);
  const { id } = await ctx.params;
  try {
    await enqueueReport(user.id, id);
    return Response.json({ status: "generating" }, { status: 202 });
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
  const job = await reportJobState(user.id, id);
  if (isReportGenerating(user.id, id) || job?.status === "generating") {
    return Response.json({ status: "generating" }, { status: 202, headers: { "Cache-Control": "no-store" } });
  }
  if (job?.status === "failed") return errorResponse(409, job.error || errors.report.notFound, "report_failed");
  if (!report) return errorResponse(404, errors.report.notFound, "report_not_found");
  return Response.json({ report });
});
