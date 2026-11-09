import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { hashToken } from "@/lib/auth/session";
import { HttpError } from "@/lib/http-error";

export async function issueAccount(emailInput: string, name: string, reset = false, admin = false) {
  const email = z.email().max(200).parse(emailInput.trim().toLowerCase());
  const cleanName = reset ? "" : z.string().trim().min(1).max(50).parse(name);
  const token = randomBytes(32).toString("base64url");
  const passwordHash = await hashPassword(randomBytes(48).toString("base64url"));
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email } });
    if (existing && !reset) throw new Error("이미 존재하는 계정입니다. reset 명령을 사용하세요.");
    if (!existing && reset) throw new Error("계정을 찾지 못했습니다.");
    if (existing?.status === "suspended") throw new Error("정지 계정입니다. 먼저 resume 명령을 사용하세요.");
    const user = existing
      ? await tx.user.update({ where: { id: existing.id }, data: {
        status: "invited", provisioned: true, passwordHash, credentialVersion: { increment: 1 },
      } })
      : await tx.user.create({ data: {
        email, name: cleanName, passwordHash, status: "invited", provisioned: true,
        role: admin ? "admin" : "member", settings: { create: {} },
      } });
    await tx.session.deleteMany({ where: { userId: user.id } });
    await tx.accountInvitation.deleteMany({ where: { userId: user.id } });
    await tx.accountInvitation.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt } });
    await tx.auditEvent.create({ data: { action: reset ? "account.reset" : "account.issue", userId: user.id } });
  });
  return { token, expiresAt };
}

export async function activateAccount(token: string, password: string, accessEmail: string | null = null) {
  const tokenHash = hashToken(token);
  const passwordHash = await hashPassword(password);
  return prisma.$transaction(async (tx) => {
    const invitation = await tx.accountInvitation.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!invitation || invitation.expiresAt <= new Date() || invitation.user.status !== "invited" ||
      (accessEmail && invitation.user.email !== accessEmail)) {
      throw new HttpError(400, "초대가 만료되었거나 유효하지 않습니다. 운영자에게 재발급을 요청해 주세요.", "invalid_invitation");
    }
    const consumed = await tx.accountInvitation.deleteMany({ where: { id: invitation.id } });
    if (consumed.count !== 1) throw new HttpError(409, "이미 사용한 초대입니다.", "invalid_invitation");
    await tx.user.update({ where: { id: invitation.userId }, data: { passwordHash, status: "active", credentialVersion: { increment: 1 } } });
    await tx.session.deleteMany({ where: { userId: invitation.userId } });
    await tx.auditEvent.create({ data: { action: "account.activate", userId: invitation.userId } });
  });
}

export async function setAccountStatus(email: string, suspended: boolean) {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { email: email.trim().toLowerCase() } });
    await tx.user.update({ where: { id: user.id }, data: { status: suspended ? "suspended" : "active", credentialVersion: { increment: 1 } } });
    await tx.session.deleteMany({ where: { userId: user.id } });
    await tx.accountInvitation.deleteMany({ where: { userId: user.id } });
    await tx.auditEvent.create({ data: { action: suspended ? "account.suspend" : "account.resume", userId: user.id } });
  });
}
