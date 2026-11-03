import type { NextRequest } from "next/server";
import { handler, requireRequestUser } from "@/lib/http";
import { deletePortfolio } from "@/services/portfolio";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = handler(async (req: NextRequest, ctx: Ctx) => {
  const user = await requireRequestUser(req);
  const { id } = await ctx.params;
  await deletePortfolio(user.id, id);
  return Response.json({ ok: true });
});
