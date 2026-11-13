import type { NextRequest } from "next/server";
import { z } from "zod";
import { handler, parseBody, requireRequestUser } from "@/lib/http";
import { THEME_IDS } from "@/services/claude/types";
import { createConversation, listConversations } from "@/services/conversation";
import { normalizeCallDurationSec } from "@/services/call/duration";

const createSchema = z.object({
  kind: z.enum(["chat", "call"]),
  theme: z.enum(THEME_IDS),
  hintsEnabled: z.boolean().optional(),
  durationMin: z.number().int().optional(),
  portfolioId: z.string().nullable().optional(),
  learningItemIds: z.array(z.string().max(100)).max(3).optional(),
});

export const GET = handler(async (req: NextRequest) => {
  const user = await requireRequestUser(req);
  const kind = req.nextUrl.searchParams.get("kind");
  const list = await listConversations(
    user.id,
    kind === "chat" || kind === "call" ? kind : undefined,
  );
  return Response.json({
    conversations: list.map((c) => ({
      id: c.id,
      kind: c.kind,
      theme: c.theme,
      title: c.title,
      startedAt: c.startedAt,
      endedAt: c.endedAt,
      updatedAt: c.updatedAt,
      messageCount: c._count.messages,
      hasReport: Boolean(c.report),
    })),
  });
});

export const POST = handler(async (req: NextRequest) => {
  const user = await requireRequestUser(req);
  const body = await parseBody(req, createSchema);
  const conv = await createConversation({
    userId: user.id,
    kind: body.kind,
    theme: body.theme,
    hintsEnabled: body.hintsEnabled,
    durationSec: body.kind === "call" ? normalizeCallDurationSec(body.durationMin) : null,
    portfolioId: body.portfolioId ?? null,
    learningItemIds: body.learningItemIds,
  });
  return Response.json({ conversation: conv }, { status: 201 });
});
