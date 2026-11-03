import type { NextRequest } from "next/server";
import { clearSessionCookieHeader, destroySession, SESSION_COOKIE } from "@/lib/auth/session";
import { handler } from "@/lib/http";

export const POST = handler(async (req: NextRequest) => {
  await destroySession(req.cookies.get(SESSION_COOKIE)?.value);
  return Response.json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookieHeader() } });
});
