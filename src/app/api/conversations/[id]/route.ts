import type { NextRequest } from "next/server";
import { z } from "zod";
import { handler, parseBody, requireRequestUser } from "@/lib/http";
import { getOwnedConversation, updateConversation } from "@/services/conversation";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (req: NextRequest, ctx: Ctx) => {
  const user = await requireRequestUser(req);
  const { id } = await ctx.params;
  const conv = await getOwnedConversation(user.id, id);
  return Response.json({
    conversation: {
      id: conv.id,
      kind: conv.kind,
      theme: conv.theme,
      title: conv.title,
      hintsEnabled: conv.hintsEnabled,
      durationSec: conv.durationSec,
      startedAt: conv.startedAt,
      endedAt: conv.endedAt,
      portfolio: conv.portfolio ? { id: conv.portfolio.id, title: conv.portfolio.title } : null,
      hasReport: Boolean(conv.report),
      messages: conv.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        hint: m.hint,
        index: m.index,
        createdAt: m.createdAt,
      })),
    },
  });
});

const patchSchema = z.object({
  hintsEnabled: z.boolean().optional(),
  title: z.string().trim().min(1).max(80).optional(),
  ended: z.boolean().optional(),
  // 통화 시작 시각 기록(통화 화면의 "통화 시작" 클릭 시점)
  started: z.boolean().optional(),
});

export const PATCH = handler(async (req: NextRequest, ctx: Ctx) => {
  const user = await requireRequestUser(req);
  const { id } = await ctx.params;
  const body = await parseBody(req, patchSchema);
  const conv = await updateConversation(user.id, id, {
    ...(body.hintsEnabled !== undefined ? { hintsEnabled: body.hintsEnabled } : {}),
    ...(body.title !== undefined ? { title: body.title } : {}),
    ...(body.ended ? { endedAt: new Date() } : {}),
    ...(body.started ? { startedAt: new Date() } : {}),
  });
  return Response.json({
    conversation: {
      id: conv.id,
      hintsEnabled: conv.hintsEnabled,
      title: conv.title,
      endedAt: conv.endedAt,
      startedAt: conv.startedAt,
    },
  });
});
