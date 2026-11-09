import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { auth } from "../src/content/ko";
function accountCommand(args: string[]) {
  return execFileSync(process.execPath, ["--import", "tsx", "scripts/users.ts", ...args], {
    encoding: "utf8", env: { ...process.env, DATABASE_URL: "file:./e2e.db", AUTH_SECRET: process.env.AUTH_SECRET ?? "e2e-secret-e2e-secret-e2e-secret-0000", APP_URL: "http://localhost:3100" },
  });
}
test("초대 링크로 비밀번호 설정 후 로그인하고 정지된 세션은 API를 쓸 수 없다", async ({ page }) => {
  const email = `invite-${randomUUID()}@test.local`;
  const output = accountCommand(["issue", email, "초대 테스트"]);
  const token = output.match(/\/activate#([A-Za-z0-9_-]+)/)?.[1];
  expect(token).toBeTruthy();
  const requests: string[] = [];
  page.on("request", (req) => requests.push(req.url()));
  await page.goto(`/activate#${token}`);
  await page.getByLabel("새 비밀번호", { exact: true }).fill("invited-strong-password-123");
  await page.getByLabel("비밀번호 확인", { exact: true }).fill("invited-strong-password-123");
  await page.getByRole("button", { name: "비밀번호 설정 후 로그인" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(requests.every((url) => !url.includes(token!))).toBe(true);
  await page.getByLabel(auth.email, { exact: true }).fill(email);
  await page.getByLabel(auth.password, { exact: true }).fill("invited-strong-password-123");
  await page.getByRole("button", { name: auth.loginButton, exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  const usage = await page.request.get("/api/usage");
  expect((await usage.json()).byUser.map((user: { email: string }) => user.email)).toEqual([email]);
  accountCommand(["suspend", email]);
  expect((await page.request.get("/api/auth/me")).status()).toBe(401);
  expect((await page.request.post("/api/conversations", { data: { kind: "chat", theme: "free" } })).status()).toBe(401);
});
