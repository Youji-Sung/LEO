import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handler, parseBody, requireRequestUser, HttpError } from "@/lib/http";
import { reviewLearning } from "@/services/learning";
type Context = { params: Promise<{ id: string }> };
export const PATCH = handler(async (req: NextRequest, ctx: Context) => {
  const user = await requireRequestUser(req);
  const body = await parseBody(
    req,
    z.object({
      outcome: z.enum(["again", "hint", "ready"]),
      answer: z.string().max(2000),
      version: z.number().int().min(0),
    }),
  );
  await reviewLearning(user.id, (await ctx.params).id, body);
  return Response.json({ ok: true });
});
export const DELETE = handler(async (req: NextRequest, ctx: Context) => {
  const user = await requireRequestUser(req);
  const deleted = await prisma.learningItem.deleteMany({
    where: { id: (await ctx.params).id, userId: user.id },
  });
  if (!deleted.count) throw new HttpError(404, "학습 표현을 찾지 못했어요.", "learning_not_found");
  return Response.json({ ok: true });
});
