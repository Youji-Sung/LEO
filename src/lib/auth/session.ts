import { createHmac, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { canUseAccount } from "@/lib/auth/account-policy";

export const SESSION_COOKIE = "leo_session";
const SESSION_DAYS = 30;

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET 이 설정되지 않았습니다. scripts/bootstrap.sh 를 실행하세요.");
  }
  return s;
}

export function hashToken(token: string): string {
  return createHmac("sha256", secret()).update(token).digest("hex");
}

export async function createSession(userId: string, credentialVersion?: number): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (!canUseAccount(user) || (credentialVersion !== undefined && user.credentialVersion !== credentialVersion)) {
      throw new Error("계정 상태가 변경되었습니다. 다시 로그인해 주세요.");
    }
    await tx.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });
  });
  return { token, expiresAt };
}

export type SessionUser = { id: string; email: string; name: string; role: string };

export async function findUserBySessionToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true, name: true, role: true, status: true, provisioned: true } } },
  });
  if (!session) return null;
  if (!canUseAccount(session.user)) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  const { id, email, name, role } = session.user;
  return { id, email, name, role };
}

export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export function sessionCookieHeader(token: string, expiresAt: Date): string {
  const secure = (process.env.APP_URL ?? "").startsWith("https://") ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}${secure}`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
