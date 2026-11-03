import type { NextRequest } from "next/server";
import { z } from "zod";
import { handler, parseBody, requireRequestUser } from "@/lib/http";
import { sendMessage, streamEventsToResponse } from "@/services/conversation";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({ content: z.string().max(4000) });

export const POST = handler(async (req: NextRequest, ctx: Ctx) => {
  const user = await requireRequestUser(req);
  const { id } = await ctx.params;
  const body = await parseBody(req, schema);
  const events = sendMessage({ userId: user.id, conversationId: id, content: body.content });
  // 첫 이벤트 전에 나는 오류(404, 턴 상한 등)는 JSON 상태 코드로 돌려주기 위해 미리 한 번 당겨 본다.
  const first = await events.next();
  if (first.done) return Response.json({ ok: true });
  async function* rest() {
    yield first.value;
    for await (const ev of events) yield ev;
  }
  return streamEventsToResponse(rest());
});
