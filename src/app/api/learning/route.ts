import type { NextRequest } from "next/server";
import { z } from "zod";
import { handler, parseBody, requireRequestUser } from "@/lib/http";
import { listLearning, saveLearning } from "@/services/learning";
export const GET = handler(async (req: NextRequest) =>
  Response.json({ items: await listLearning((await requireRequestUser(req)).id) }),
);
export const POST = handler(async (req: NextRequest) => {
  const user = await requireRequestUser(req);
  const body = await parseBody(
    req,
    z.object({
      conversationId: z.string().max(100),
      kind: z.enum(["vocabulary", "expression"]),
      index: z.number().int().min(0).max(9),
    }),
  );
  const item = await saveLearning(user.id, body.conversationId, body.kind, body.index);
  return Response.json({ item }, { status: 201 });
});
