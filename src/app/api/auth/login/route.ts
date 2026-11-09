import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, sessionCookieHeader } from "@/lib/auth/session";
import { handler, HttpError, parseBody } from "@/lib/http";
import { errors } from "@/content/ko";
import { clientIp, loginLimiter } from "@/lib/auth/rate-limit";
import { consumeLoginAttempt, resetSuccessfulLogin } from "@/lib/auth/login-throttle";
import { canUseAccount } from "@/lib/auth/account-policy";
import { verifyAccess } from "@/lib/auth/access";
import { isThemeMode, themeCookieHeader } from "@/lib/theme";
import { directionCookieHeader, isDirectionChoice } from "@/lib/direction";

const schema = z.object({ email: z.string().max(200), password: z.string().max(200) });

export const POST = handler(async (req: NextRequest) => {
  const body = await parseBody(req, schema);
  const email = body.email.trim().toLowerCase();
  await verifyAccess(req.headers, email);
  await consumeLoginAttempt(req.headers, email);
  const key = `${clientIp(req.headers)}|${email}`;
  const gate = loginLimiter.check(key);
  if (!gate.allowed) {
    const minutes = Math.max(1, Math.ceil(gate.retryAfterMs / 60_000));
    throw new HttpError(429, errors.auth.tooManyAttempts(minutes), "too_many_attempts");
  }
  const user = await prisma.user.findUnique({ where: { email } });
  // A dummy scrypt prevents a cheap timing difference for unknown email addresses.
  const passwordOk = await verifyPassword(body.password, user?.passwordHash ?? `scrypt$${"0".repeat(32)}$${"0".repeat(128)}`);
  if (!user || !passwordOk || !canUseAccount(user)) {
    loginLimiter.fail(key);
    throw new HttpError(401, errors.auth.badCredentials, "bad_credentials");
  }
  loginLimiter.reset(key);
  const { token, expiresAt } = await createSession(user.id, user.credentialVersion);
  resetSuccessfulLogin(email);
  // 다른 브라우저에서 로그인해도 저장된 테마·디자인 시안이 첫 화면부터 적용되게 쿠키를 함께 내린다.
  const settings = await prisma.userSettings.findUnique({ where: { userId: user.id } });
  const headers = new Headers({ "Set-Cookie": sessionCookieHeader(token, expiresAt) });
  if (settings && isThemeMode(settings.theme)) headers.append("Set-Cookie", themeCookieHeader(settings.theme));
  if (settings && isDirectionChoice(settings.direction))
    headers.append("Set-Cookie", directionCookieHeader(settings.direction));
  return Response.json({ user: { id: user.id, email: user.email, name: user.name } }, { headers });
});
