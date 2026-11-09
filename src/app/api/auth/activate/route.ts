import type { NextRequest } from "next/server";
import { z } from "zod";
import { handler, parseBody } from "@/lib/http";
import { verifyAccess } from "@/lib/auth/access";
import { activateAccount } from "@/services/accounts";
import { consumeLoginAttempt } from "@/lib/auth/login-throttle";
export const POST = handler(async (req: NextRequest) => {
  await consumeLoginAttempt(req.headers, "activation");
  const body = await parseBody(req, z.object({ token: z.string().min(40).max(100), password: z.string().min(12).max(200) }));
  await activateAccount(body.token, body.password, await verifyAccess(req.headers));
  return Response.json({ ok: true });
});
