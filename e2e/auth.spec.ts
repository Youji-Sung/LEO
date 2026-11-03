import { expect, test } from "@playwright/test";
import { gotoHydrated, login } from "./helpers";

test("로그인하지 않으면 로그인 화면으로 보낸다", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();
});

test("로그인 → 홈 → 로그아웃", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("heading", { name: "안녕하세요, 개발자 1님" })).toBeVisible();

  await page.getByRole("button", { name: "로그아웃" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("잘못된 비밀번호는 오류를 보여 준다", async ({ page }) => {
  await gotoHydrated(page, "/login");
  await page.getByLabel("이메일").fill("dev1@leo.local");
  await page.getByLabel("비밀번호").fill("wrong-password");
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page.getByRole("form", { name: "로그인" }).getByRole("alert")).toContainText("올바르지 않습니다");
});

test("회원가입 후 바로 로그인 상태가 된다", async ({ page }) => {
  await gotoHydrated(page, "/signup");
  await page.getByLabel("이름").fill("신규");
  await page.getByLabel("이메일").fill(`new-${Date.now()}@leo.local`);
  await page.getByLabel("비밀번호").fill("password-123");
  await page.getByRole("button", { name: "가입하기" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "안녕하세요, 신규님" })).toBeVisible();
});
