import type { NextRequest } from "next/server";
import { handler, HttpError, requireRequestUser } from "@/lib/http";
import { canExtend, extendedDurationSec, MAX_CALL_MINUTES } from "@/services/call/duration";
import { getOwnedConversation, updateConversation } from "@/services/conversation";

type Ctx = { params: Promise<{ id: string }> };

// 통화 10분 연장 (최대 30분)
export const POST = handler(async (req: NextRequest, ctx: Ctx) => {
  const user = await requireRequestUser(req);
  const { id } = await ctx.params;
  const conv = await getOwnedConversation(user.id, id);
  if (conv.kind !== "call") throw new HttpError(400, "통화만 연장할 수 있습니다.", "not_a_call");
  if (conv.endedAt) throw new HttpError(409, "이미 종료된 통화입니다.", "conversation_ended");
  const current = conv.durationSec ?? 0;
  if (!canExtend(current)) throw new HttpError(409, `통화는 최대 ${MAX_CALL_MINUTES}분까지입니다.`, "max_duration");
  const updated = await updateConversation(user.id, id, { durationSec: extendedDurationSec(current) });
  return Response.json({ durationSec: updated.durationSec, canExtend: canExtend(updated.durationSec ?? 0) });
});
