import { NextRequest } from "next/server";
import { beforeAll, describe, expect, it } from "vitest";
import { POST as signup } from "@/app/api/auth/signup/route";
import { POST as login } from "@/app/api/auth/login/route";
import { PATCH as patchSettings } from "@/app/api/settings/route";
import { prisma } from "@/lib/db";

function req(path: string, init: { method?: string; body?: unknown; cookie?: string } = {}) {
  return new NextRequest(`http://localhost${path}`, {
    method: init.method ?? "POST",
    headers: { "Content-Type": "application/json", ...(init.cookie ? { cookie: init.cookie } : {}) },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

const setCookies = (res: Response) => res.headers.getSetCookie();
const sessionCookie = (res: Response) => setCookies(res).find((c) => c.startsWith("leo_session="))!.split(";")[0]!;

const email = `direction-${Date.now()}@test.local`;
const password = "password-123";

describe("design direction setting", () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
  });

  it("saves the direction in settings, sets the cookie, and re-sends it on login", async () => {
    const su = await signup(req("/api/auth/signup", { body: { email, password, name: "테스터" } }), {});
    expect(su.status).toBe(201);
    const cookie = sessionCookie(su);

    const bad = await patchSettings(req("/api/settings", { method: "PATCH", cookie, body: { direction: "neon" } }), {});
    expect(bad.status).toBe(400);

    const ok = await patchSettings(req("/api/settings", { method: "PATCH", cookie, body: { direction: "study" } }), {});
    expect(ok.status).toBe(200);
    expect(setCookies(ok).some((c) => c.startsWith("leo_direction=study;"))).toBe(true);
    const saved = await prisma.userSettings.findFirst({ where: { user: { email } } });
    expect(saved?.direction).toBe("study");

    const lg = await login(req("/api/auth/login", { body: { email, password } }), {});
    expect(lg.status).toBe(200);
    expect(setCookies(lg).some((c) => c.startsWith("leo_direction=study;"))).toBe(true);

    const back = await patchSettings(req("/api/settings", { method: "PATCH", cookie, body: { direction: "basic" } }), {});
    expect(setCookies(back).some((c) => c.startsWith("leo_direction=off;"))).toBe(true);
  });
});
