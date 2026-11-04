import { expect, test } from "@playwright/test";
import { chat, usage } from "../src/content/ko";
import { login } from "./helpers";

test("사용량 페이지가 합계와 표를 렌더한다", async ({ page }) => {
  await login(page);
  // 채팅 한 번으로 사용량 레코드를 만든다
  await page.goto("/chat");
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await page.getByRole("button", { name: chat.start }).click();
  await expect(page).toHaveURL(/\/chat\/[a-z0-9]+$/);
  await page.getByLabel(chat.inputLabel).fill("Hello!");
  await page.getByLabel(chat.inputLabel).press("Enter");
  await expect(page.getByTestId("msg-assistant")).toHaveCount(1, { timeout: 15_000 });

  await page.goto("/usage?period=all");
  await expect(page.getByRole("heading", { name: usage.pageTitle })).toBeVisible();
  await expect(page.getByRole("table", { name: /사용자별/ })).toBeVisible();
  await expect(page.getByRole("table", { name: /기능별/ })).toBeVisible();
  await expect(page.getByRole("table", { name: /최근 호출/ })).toBeVisible();
  await expect(page.getByRole("table", { name: /최근 호출/ }).locator("tbody tr").first()).toContainText("mock-claude");
  await expect(page.getByRole("table", { name: /기능별/ })).toContainText(usage.features.chat);
});
