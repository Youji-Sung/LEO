import { expect, test } from "@playwright/test";
import { gotoHydrated, login } from "./helpers";

test.describe("모바일 폭", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__LEO_FAKE_VOICE = true;
    });
  });

  test("통화 화면이 가로 스크롤 없이 타이머·트랜스크립트·끊기 버튼을 보여 준다", async ({ page }) => {
    await login(page);
    await page.goto("/call");
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
    await page.getByLabel("테스트(20초)").check();
    await page.getByRole("button", { name: "다음" }).click();
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
    await page.getByTestId("start-call").click();
    await page.evaluate((t) => window.__leoFakeVoice!.say(t), "Hello, can you hear me?");
    await expect(page.getByTestId("msg-assistant")).toHaveCount(1, { timeout: 15_000 });

    const noHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    expect(noHorizontalScroll).toBe(true);
    await expect(page.getByTestId("timer")).toBeInViewport();
    await expect(page.getByTestId("hangup")).toBeInViewport();
    await expect(page.getByTestId("msg-assistant").first()).toBeVisible();
    await page.screenshot({ path: "test-results/call-mobile.png" });
    await page.getByTestId("hangup").click();
    await expect(page).toHaveURL(/\/report$/, { timeout: 30_000 });
    const reportNoScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    expect(reportNoScroll).toBe(true);
  });
});

test("키보드만으로 로그인할 수 있고 포커스 순서가 자연스럽다", async ({ page }) => {
  await gotoHydrated(page, "/login");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("이메일")).toBeFocused();
  await page.keyboard.type("dev1@leo.local");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("비밀번호")).toBeFocused();
  await page.keyboard.type("leo-pass-1234");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "로그인" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/$/);
});

test("주요 컨트롤에 접근 가능한 이름이 있다", async ({ page }) => {
  await login(page);
  await page.goto("/chat");
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await expect(page.getByRole("navigation", { name: "주 메뉴" })).toBeVisible();
  await expect(page.getByRole("form", { name: "새 채팅" })).toBeVisible();
  await expect(page.getByLabel("테마")).toBeVisible();
  await page.getByRole("button", { name: "새 채팅 시작" }).click();
  await expect(page.getByRole("log", { name: "대화" })).toBeVisible();
  await expect(page.getByLabel("메시지")).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "교정 힌트" })).toBeVisible();
});
