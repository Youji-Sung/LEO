import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession, sessionCookieHeader } from "@/lib/auth/session";
import { handler, HttpError, parseBody } from "@/lib/http";
import { isUniqueViolation } from "@/lib/db";
import { errors } from "@/content/ko";

const schema = z.object({
  email: z.email(errors.auth.emailFormat).max(200),
  password: z.string().min(8, errors.auth.passwordMin).max(200),
  name: z.string().trim().min(1, errors.auth.nameRequired).max(50),
});

export const POST = handler(async (req: NextRequest) => {
  const body = await parseBody(req, schema);
  const email = body.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new HttpError(409, errors.auth.emailTaken, "email_taken");
  let user: { id: string; email: string; name: string };
  try {
    user = await prisma.user.create({
      data: {
        email,
        name: body.name,
        passwordHash: await hashPassword(body.password),
        settings: { create: {} },
      },
      select: { id: true, email: true, name: true },
    });
  } catch (e) {
    // 동시 가입으로 unique 제약에 걸린 경우
    if (isUniqueViolation(e)) throw new HttpError(409, errors.auth.emailTaken, "email_taken");
    throw e;
  }
  const { token, expiresAt } = await createSession(user.id);
  return Response.json(
    { user },
    { status: 201, headers: { "Set-Cookie": sessionCookieHeader(token, expiresAt) } },
  );
});
