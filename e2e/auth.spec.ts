import { expect, test } from "@playwright/test";
import { auth, errors, home, nav } from "../src/content/ko";
import { gotoHydrated, login } from "./helpers";

test("로그인하지 않으면 로그인 화면으로 보낸다", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: auth.loginTitle })).toBeVisible();
});

test("로그인 → 홈 → 로그아웃", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("heading", { name: home.greeting("개발자 1") })).toBeVisible();

  await page.getByRole("button", { name: nav.logout }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("잘못된 비밀번호는 오류를 보여 준다", async ({ page }) => {
  await gotoHydrated(page, "/login");
  await page.getByLabel(auth.email).fill("dev1@leo.local");
  await page.getByLabel(auth.password).fill("wrong-password");
  await page.getByRole("button", { name: auth.loginButton }).click();
  await expect(page.getByRole("form", { name: auth.loginTitle }).getByRole("alert")).toContainText(
    errors.auth.badCredentials,
  );
});

test("회원가입 후 바로 로그인 상태가 된다", async ({ page }) => {
  await gotoHydrated(page, "/signup");
  await page.getByLabel(auth.name).fill("신규");
  await page.getByLabel(auth.email).fill(`new-${Date.now()}@leo.local`);
  await page.getByLabel(auth.password).fill("password-123");
  await page.getByRole("button", { name: auth.signupButton }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: home.greeting("신규") })).toBeVisible();
});

test("만료된 세션 쿠키가 있어도 로그인 화면이 열린다 (리다이렉트 루프 없음)", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "leo_session", value: "stale-token-value", url: "http://localhost:3100" },
  ]);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: auth.loginTitle })).toBeVisible();
  await login(page);
});
