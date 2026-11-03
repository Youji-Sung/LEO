import { expect, type Page } from "@playwright/test";

export const SEED_PASSWORD = process.env.SEED_USER_PASSWORD ?? "leo-pass-1234";
export const SEED_EMAIL = "dev1@leo.local";

// 개발 서버는 클라이언트 번들을 지연 컴파일하므로, 하이드레이션이 끝난 뒤에 상호작용한다.
export async function gotoHydrated(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
}

export async function login(page: Page, email = SEED_EMAIL, password = SEED_PASSWORD): Promise<void> {
  await gotoHydrated(page, "/login");
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호").fill(password);
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).toHaveURL(/\/$/);
}
