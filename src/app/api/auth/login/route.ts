import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, sessionCookieHeader } from "@/lib/auth/session";
import { handler, HttpError, parseBody } from "@/lib/http";

const schema = z.object({ email: z.string().max(200), password: z.string().max(200) });

export const POST = handler(async (req: NextRequest) => {
  const body = await parseBody(req, schema);
  const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    throw new HttpError(401, "이메일 또는 비밀번호가 올바르지 않습니다.", "bad_credentials");
  }
  const { token, expiresAt } = await createSession(user.id);
  return Response.json(
    { user: { id: user.id, email: user.email, name: user.name } },
    { headers: { "Set-Cookie": sessionCookieHeader(token, expiresAt) } },
  );
});
