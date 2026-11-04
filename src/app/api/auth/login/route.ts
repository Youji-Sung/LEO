import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, sessionCookieHeader } from "@/lib/auth/session";
import { handler, HttpError, parseBody } from "@/lib/http";
import { errors } from "@/content/ko";
import { clientIp, loginLimiter } from "@/lib/auth/rate-limit";

const schema = z.object({ email: z.string().max(200), password: z.string().max(200) });

export const POST = handler(async (req: NextRequest) => {
  const body = await parseBody(req, schema);
  const email = body.email.toLowerCase();
  const key = `${clientIp(req.headers)}|${email}`;
  const gate = loginLimiter.check(key);
  if (!gate.allowed) {
    const minutes = Math.max(1, Math.ceil(gate.retryAfterMs / 60_000));
    throw new HttpError(429, errors.auth.tooManyAttempts(minutes), "too_many_attempts");
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    loginLimiter.fail(key);
    throw new HttpError(401, errors.auth.badCredentials, "bad_credentials");
  }
  loginLimiter.reset(key);
  const { token, expiresAt } = await createSession(user.id);
  return Response.json(
    { user: { id: user.id, email: user.email, name: user.name } },
    { headers: { "Set-Cookie": sessionCookieHeader(token, expiresAt) } },
  );
});
