import type { NextRequest } from "next/server";
import { z } from "zod";
import { handler, HttpError, requireRequestUser } from "@/lib/http";
import { getUsageSummary, USAGE_PERIODS } from "@/services/usage";

const querySchema = z.object({
  period: z.enum(USAGE_PERIODS).default("7d"),
  userId: z.string().min(1).optional(),
});

export const GET = handler(async (req: NextRequest) => {
  const user = await requireRequestUser(req);
  const params = req.nextUrl.searchParams;
  const parsed = querySchema.safeParse({
    period: params.get("period") ?? undefined,
    userId: params.get("userId") ?? undefined,
  });
  if (!parsed.success) throw new HttpError(400, "기간 값이 올바르지 않습니다.", "validation");
  const summary = await getUsageSummary({ viewerUserId: user.id, ...parsed.data });
  return Response.json(summary);
});
