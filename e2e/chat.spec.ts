import { expect, test } from "@playwright/test";
import { chat, report, themes } from "../src/content/ko";
import { login } from "./helpers";

test("로그인 → 새 채팅 → 메시지 3회 → 리포트 생성, 새로고침 후 대화 유지", async ({ page }) => {
  await login(page);
  await page.goto("/chat");
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await page.getByLabel(themes.label).selectOption("interview");
  await page.getByRole("checkbox", { name: chat.hintsToggle }).check();
  await page.getByRole("button", { name: chat.start }).click();
  await expect(page).toHaveURL(/\/chat\/[a-z0-9]+$/);
  const url = page.url();

  const input = page.getByLabel(chat.inputLabel);
  const sayings = ["Hi, I am backend developer for five years.", "I go to school yesterday.", "There was very much people."];
  for (const [i, s] of sayings.entries()) {
    await input.fill(s);
    await page.getByRole("button", { name: chat.send }).click();
    await expect(page.getByTestId("msg-assistant")).toHaveCount(i + 1, { timeout: 15_000 });
    await expect(page.getByTestId("streaming")).toHaveCount(0);
  }
  await expect(page.getByTestId("msg-user")).toHaveCount(3);
  await expect(page.getByTestId("hint").first()).toContainText("went");

  await page.reload();
  await expect(page.getByTestId("msg-user")).toHaveCount(3);
  await expect(page.getByTestId("msg-assistant")).toHaveCount(3);
  await expect(page.getByTestId("msg-user").first()).toContainText(sayings[0]!);

  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await page.getByRole("button", { name: chat.makeReport }).click();
  await expect(page).toHaveURL(/\/history\/[a-z0-9]+\/report$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: report.pageTitle })).toBeVisible();
  await expect(page.getByRole("heading", { name: report.sections.summary })).toBeVisible();
  await expect(page.getByTestId("score")).toHaveCount(4);
  await expect(page.getByTestId("interview-section")).toBeVisible();

  // 채팅으로 돌아가면 종료 상태
  await page.goto(url);
  await expect(page.getByText(chat.endedNotice)).toBeVisible();
});

test("교정 힌트를 끄면 힌트가 붙지 않는다", async ({ page }) => {
  await login(page);
  await page.goto("/chat");
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await page.getByRole("checkbox", { name: chat.hintsToggle }).uncheck();
  await page.getByRole("button", { name: chat.start }).click();
  await expect(page).toHaveURL(/\/chat\/[a-z0-9]+$/);
  await page.getByLabel(chat.inputLabel).fill("Hello there!");
  await page.getByLabel(chat.inputLabel).press("Enter");
  await expect(page.getByTestId("msg-assistant")).toHaveCount(1, { timeout: 15_000 });
  await expect(page.getByTestId("hint")).toHaveCount(0);
});
