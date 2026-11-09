import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { issueAccount, activateAccount, setAccountStatus } from "@/services/accounts";
import { createSession, findUserBySessionToken } from "@/lib/auth/session";
import { POST as signup } from "@/app/api/auth/signup/route";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as message } from "@/app/api/conversations/[id]/messages/route";
import { POST as report } from "@/app/api/conversations/[id]/report/route";
import { GET as usage } from "@/app/api/usage/route";
import { getClaudeProvider } from "@/services/claude";
import { getUsageSummary } from "@/services/usage";
import { isSignupAllowed } from "@/lib/auth/signup-gate";
import { consumeLoginAttempt } from "@/lib/auth/login-throttle";

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
const password = "personal-long-password-123";
function req(path: string, body?: unknown, cookie?: string, origin?: string) {
  return new NextRequest(`http://localhost${path}`, { method: body === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie: `leo_session=${cookie}` } : {}), ...(origin ? { origin } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body) });
}
async function issued() {
  const email = `${randomUUID()}@test.local`;
  const invite = await issueAccount(email, "초대 회원");
  await activateAccount(invite.token, password);
  return prisma.user.findUniqueOrThrow({ where: { email } });
}

describe("invitation security boundary", () => {
  it("closes signup with absent, malformed or invitation-only configuration", async () => {
    for (const setting of [undefined, "", "true", "0"]) {
      vi.stubEnv("LEO_ALLOW_SIGNUP", setting);
      expect(isSignupAllowed()).toBe(false);
      expect((await signup(req("/api/auth/signup", {}), {})).status).toBe(403);
    }
    vi.stubEnv("LEO_ALLOW_SIGNUP", "1"); vi.stubEnv("LEO_INVITE_ONLY", "1");
    expect((await signup(req("/api/auth/signup", {}), {})).status).toBe(403);
    vi.stubEnv("LEO_INVITE_ONLY", undefined);
    expect((await signup(req("/api/auth/signup", {}), {})).status).toBe(403);
  });

  it("requires activation; consumes an invitation once and rejects expired invitations", async () => {
    const email = `${randomUUID()}@test.local`;
    const invite = await issueAccount(email, "초대 회원");
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    await expect(createSession(user.id)).rejects.toThrow();
    await expect(activateAccount(invite.token, password, "someone-else@test.local")).rejects.toMatchObject({ code: "invalid_invitation" });
    await activateAccount(invite.token, password, email);
    await expect(activateAccount(invite.token, password)).rejects.toMatchObject({ code: "invalid_invitation" });
    const next = await issueAccount(email, "name", true);
    await prisma.accountInvitation.updateMany({ where: { userId: user.id }, data: { expiresAt: new Date(0) } });
    await expect(activateAccount(next.token, password)).rejects.toMatchObject({ code: "invalid_invitation" });
    expect(JSON.stringify(await prisma.auditEvent.findMany({ where: { userId: user.id } }))).not.toContain(invite.token);
  });

  it("revokes every session on suspend and reset, and rejects login after suspend", async () => {
    const user = await issued();
    const first = await createSession(user.id); const second = await createSession(user.id);
    await setAccountStatus(user.email, true);
    expect(await findUserBySessionToken(first.token)).toBeNull();
    expect(await findUserBySessionToken(second.token)).toBeNull();
    expect((await login(req("/api/auth/login", { email: user.email, password }), {})).status).toBe(401);
    await setAccountStatus(user.email, false);
    const session = await createSession(user.id);
    await issueAccount(user.email, "reset", true);
    expect(await findUserBySessionToken(session.token)).toBeNull();
    expect((await login(req("/api/auth/login", { email: user.email, password }), {})).status).toBe(401);
  });

  it("blocks legacy/unissued accounts in invitation mode", async () => {
    const user = await issued();
    const session = await createSession(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { provisioned: false } });
    vi.stubEnv("LEO_INVITE_ONLY", "1");
    expect(await findUserBySessionToken(session.token)).toBeNull();
    expect((await login(req("/api/auth/login", { email: user.email, password }), {})).status).toBe(401);
  });

  it("never calls the provider for anonymous, forged, expired, suspended or another owner's requests", async () => {
    const owner = await issued(); const other = await issued();
    const conv = await prisma.conversation.create({ data: { userId: owner.id, kind: "chat", theme: "free", messages: { create: { index: 0, role: "user", content: "hello" } } } });
    const expired = await createSession(owner.id);
    await prisma.session.updateMany({ where: { userId: owner.id }, data: { expiresAt: new Date(0) } });
    const suspended = await createSession(owner.id);
    await setAccountStatus(owner.email, true);
    const foreign = await createSession(other.id);
    const provider = getClaudeProvider(); const chatSpy = vi.spyOn(provider, "chatTurn"); const reportSpy = vi.spyOn(provider, "generateReport");
    for (const cookie of [undefined, "forged", expired.token, suspended.token, foreign.token]) {
      const ctx = { params: Promise.resolve({ id: conv.id }) };
      for (const [path, route, body] of [["messages", message, { content: "hello" }], ["report", report, {}]] as const) {
        const response = await route(req(`/api/conversations/${conv.id}/${path}`, body, cookie), ctx);
        expect([401, 404]).toContain(response.status);
      }
    }
    expect(chatSpy).not.toHaveBeenCalled(); expect(reportSpy).not.toHaveBeenCalled();
  });

  it("isolates usage data and rejects a forged user filter", async () => {
    const a = await issued(); const b = await issued();
    const summary = await getUsageSummary({ viewerUserId: a.id, period: "all" });
    expect(summary.byUser.map((u) => u.userId)).toEqual([a.id]);
    const session = await createSession(a.id);
    expect((await usage(req(`/api/usage?userId=${b.id}`, undefined, session.token), {})).status).toBe(403);
  });

  it("rejects cross-origin mutation and missing production Origin before authentication work", async () => {
    expect((await login(req("/api/auth/login", {}, undefined, "https://evil.invalid"), {})).status).toBe(403);
    vi.stubEnv("LEO_PRODUCTION", "1");
    expect((await login(req("/api/auth/login", {}), {})).status).toBe(403);
  });

  it("persists account-wide throttling across different IP headers", async () => {
    const email = `${randomUUID()}@test.local`;
    for (let i = 0; i < 20; i++) await consumeLoginAttempt(new Headers({ "x-forwarded-for": `spoof-${i}` }), email);
    await expect(consumeLoginAttempt(new Headers(), email)).rejects.toMatchObject({ status: 429 });
  });
});
