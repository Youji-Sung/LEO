import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("로그인 → 새 채팅 → 메시지 3회 → 리포트 생성, 새로고침 후 대화 유지", async ({ page }) => {
  await login(page);
  await page.goto("/chat");
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await page.getByLabel("테마").selectOption("interview");
  await page.getByLabel("교정 힌트 켜기").check();
  await page.getByRole("button", { name: "새 채팅 시작" }).click();
  await expect(page).toHaveURL(/\/chat\/[a-z0-9]+$/);
  const url = page.url();

  const input = page.getByLabel("메시지");
  const sayings = ["Hi, I am backend developer for five years.", "I go to school yesterday.", "There was very much people."];
  for (const [i, s] of sayings.entries()) {
    await input.fill(s);
    await page.getByRole("button", { name: "보내기" }).click();
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
  await page.getByRole("button", { name: "리포트 생성" }).click();
  await expect(page).toHaveURL(/\/history\/[a-z0-9]+\/report$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "리포트" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "요약" })).toBeVisible();
  await expect(page.getByTestId("score")).toHaveCount(4);
  await expect(page.getByTestId("interview-section")).toBeVisible();

  // 채팅으로 돌아가면 종료 상태
  await page.goto(url);
  await expect(page.getByText("종료된 대화입니다")).toBeVisible();
});

test("교정 힌트를 끄면 힌트가 붙지 않는다", async ({ page }) => {
  await login(page);
  await page.goto("/chat");
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await page.getByLabel("교정 힌트 켜기").uncheck();
  await page.getByRole("button", { name: "새 채팅 시작" }).click();
  await expect(page).toHaveURL(/\/chat\/[a-z0-9]+$/);
  await page.getByLabel("메시지").fill("Hello there!");
  await page.getByLabel("메시지").press("Enter");
  await expect(page.getByTestId("msg-assistant")).toHaveCount(1, { timeout: 15_000 });
  await expect(page.getByTestId("hint")).toHaveCount(0);
});
