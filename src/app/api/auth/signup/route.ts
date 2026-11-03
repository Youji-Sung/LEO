import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession, sessionCookieHeader } from "@/lib/auth/session";
import { handler, HttpError, parseBody } from "@/lib/http";

const schema = z.object({
  email: z.email("이메일 형식이 아닙니다.").max(200),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다.").max(200),
  name: z.string().trim().min(1, "이름을 입력하세요.").max(50),
});

export const POST = handler(async (req: NextRequest) => {
  const body = await parseBody(req, schema);
  const email = body.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new HttpError(409, "이미 가입된 이메일입니다.", "email_taken");
  const user = await prisma.user.create({
    data: { email, name: body.name, passwordHash: await hashPassword(body.password), settings: { create: {} } },
    select: { id: true, email: true, name: true },
  });
  const { token, expiresAt } = await createSession(user.id);
  return Response.json({ user }, { status: 201, headers: { "Set-Cookie": sessionCookieHeader(token, expiresAt) } });
});
