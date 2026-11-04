import { expect, test, type Page } from "@playwright/test";
import { chat, common, errors, report, themes, transcript } from "../src/content/ko";
import { login } from "./helpers";

async function newChat(page: Page, theme: string): Promise<string> {
  await page.goto("/chat");
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await page.getByLabel(themes.label).selectOption(theme);
  await page.getByRole("button", { name: chat.start }).click();
  await expect(page).toHaveURL(/\/chat\/[a-z0-9]+$/);
  return page.url().split("/").pop()!;
}

async function sendAndWait(page: Page, text: string, count: number) {
  await page.getByLabel(chat.inputLabel).fill(text);
  await page.getByLabel(chat.inputLabel).press("Enter");
  await expect(page.getByTestId("msg-assistant")).toHaveCount(count, { timeout: 15_000 });
}

test("리포트가 모든 항목을 렌더하고 기록에서 다시 열 수 있다", async ({ page }) => {
  await login(page);
  const id = await newChat(page, "interview");
  await sendAndWait(page, "I go to school yesterday.", 1);
  await sendAndWait(page, "There was very much people.", 2);
  await page.getByRole("button", { name: chat.makeReport }).click();
  await expect(page).toHaveURL(new RegExp(`/history/${id}/report$`), { timeout: 30_000 });

  const s = report.sections;
  for (const h of [s.summary, s.scores, s.grammar, s.vocabulary, s.better, s.nextTasks, s.interview]) {
    await expect(page.getByRole("heading", { name: h })).toBeVisible();
  }
  await expect(page.getByTestId("score")).toHaveCount(4);
  await expect(page.locator(".correction")).toHaveCount(3);
  await expect(page.locator(".orig").first()).toHaveText("I go to school yesterday.");
  await expect(page.locator(".fixed").first()).toHaveText("I went to school yesterday.");

  // 기록 → 트랜스크립트 → 리포트
  await page.goto("/history");
  await expect(page.getByTestId("history-list")).toBeVisible();
  await page.getByTestId("history-list").getByRole("link", { name: /면접 · I go to school/ }).first().click();
  await expect(page).toHaveURL(new RegExp(`/history/${id}$`));
  await expect(page.getByRole("heading", { name: transcript.pageTitle })).toBeVisible();
  await expect(page.getByText("There was very much people.")).toBeVisible();
  await page.getByRole("link", { name: transcript.viewReport }).click();
  await expect(page).toHaveURL(new RegExp(`/history/${id}/report$`));
});

test("스키마 검증 실패 시 오류와 재시도 버튼을 보여 주고, 재시도로 성공한다", async ({ page }) => {
  await login(page);
  const id = await newChat(page, "free");
  await sendAndWait(page, "Please break it MOCK_INVALID_REPORT", 1);
  await page.getByRole("button", { name: chat.makeReport }).click();
  await expect(page.locator(".chat").getByRole("alert")).toContainText(errors.report.invalid, { timeout: 30_000 });
  await expect(page).toHaveURL(new RegExp(`/chat/${id}$`));

  // 리포트 페이지에서도 오류 + 재시도
  await page.goto(`/history/${id}/report`);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await page.getByRole("button", { name: report.make }).click();
  const retry = page.getByTestId("report-retry");
  await expect(retry.getByRole("alert")).toContainText(errors.report.invalid, { timeout: 30_000 });
  await expect(retry.getByRole("button", { name: common.retry })).toBeVisible();

  // 정상 발화를 하나 더 보낸 뒤 재시도하면 성공
  await page.goto(`/chat/${id}`);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await sendAndWait(page, "Okay, let me say it properly this time.", 2);
  await page.goto(`/history/${id}/report`);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await page.getByRole("button", { name: report.make }).click();
  await expect(page.getByRole("heading", { name: report.sections.summary })).toBeVisible({ timeout: 30_000 });
});
