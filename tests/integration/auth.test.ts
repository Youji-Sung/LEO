import { NextRequest } from "next/server";
import { beforeAll, describe, expect, it } from "vitest";
import { POST as signup } from "@/app/api/auth/signup/route";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as me } from "@/app/api/auth/me/route";
import { prisma } from "@/lib/db";

function req(path: string, init: { method?: string; body?: unknown; cookie?: string } = {}) {
  return new NextRequest(`http://localhost${path}`, {
    method: init.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      ...(init.cookie ? { cookie: init.cookie } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

function cookieOf(res: Response): string {
  const set = res.headers.get("set-cookie") ?? "";
  return set.split(";")[0] ?? "";
}

const email = `auth-${Date.now()}@test.local`;
const password = "password-123";

describe("auth flow", () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
  });

  it("rejects bad signup input", async () => {
    const res = await signup(req("/api/auth/signup", { body: { email: "nope", password: "short", name: "" } }), {});
    expect(res.status).toBe(400);
  });

  it("signs up, reads protected route, logs out", async () => {
    const res = await signup(req("/api/auth/signup", { body: { email, password, name: "테스터" } }), {});
    expect(res.status).toBe(201);
    const cookie = cookieOf(res);
    expect(cookie.startsWith("leo_session=")).toBe(true);

    const meRes = await me(req("/api/auth/me", { method: "GET", cookie }), {});
    expect(meRes.status).toBe(200);
    const body = (await meRes.json()) as { user: { email: string } };
    expect(body.user.email).toBe(email);

    const dup = await signup(req("/api/auth/signup", { body: { email, password, name: "x" } }), {});
    expect(dup.status).toBe(409);

    const out = await logout(req("/api/auth/logout", { cookie }), {});
    expect(out.status).toBe(200);
    expect(out.headers.get("set-cookie")).toContain("Max-Age=0");

    const afterLogout = await me(req("/api/auth/me", { method: "GET", cookie }), {});
    expect(afterLogout.status).toBe(401);
  });

  it("logs in with correct password only", async () => {
    const bad = await login(req("/api/auth/login", { body: { email, password: "wrong-password" } }), {});
    expect(bad.status).toBe(401);

    const good = await login(req("/api/auth/login", { body: { email: email.toUpperCase(), password } }), {});
    expect(good.status).toBe(200);
    const cookie = cookieOf(good);
    const meRes = await me(req("/api/auth/me", { method: "GET", cookie }), {});
    expect(meRes.status).toBe(200);
  });

  it("denies protected route without cookie", async () => {
    const res = await me(req("/api/auth/me", { method: "GET" }), {});
    expect(res.status).toBe(401);
  });
});
