import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { findUserBySessionToken, SESSION_COOKIE, type SessionUser } from "@/lib/auth/session";

// 서버 컴포넌트용
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return findUserBySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// Route Handler 용 (next/headers 없이 요청 객체만 사용해 테스트에서 직접 호출할 수 있다)
export async function getRequestUser(req: NextRequest): Promise<SessionUser | null> {
  return findUserBySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}
