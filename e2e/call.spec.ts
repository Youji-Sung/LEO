import { expect, test, type Page } from "@playwright/test";
import { callLive, callSetup, common, report, transcript } from "../src/content/ko";
import { THEMES } from "../src/services/claude/prompts/themes";
import { login, selectTheme } from "./helpers";

async function say(page: Page, text: string) {
  await page.evaluate((t) => window.__leoFakeVoice!.say(t), text);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__LEO_FAKE_VOICE = true;
  });
});

test("통화 시작 → 발화 3회 → 타이머 만료 → 리포트 화면", async ({ page }) => {
  await login(page);
  await page.goto("/call");
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await selectTheme(page, "interview");
  await page.getByLabel(callSetup.durationTest).check();
  await page.getByRole("button", { name: callSetup.micCheck }).click();
  await expect(page.getByTestId("mic-status")).toContainText(callSetup.micGranted);
  await page.getByRole("button", { name: callSetup.next }).click();
  await expect(page).toHaveURL(/\/call\/[a-z0-9]+$/);

  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await page.getByTestId("start-call").click();
  await expect(page.getByTestId("timer")).toHaveText(/0:(1\d|20)/);
  // 상대의 첫 인사가 TTS 로 읽힌다
  await expect.poll(() => page.evaluate(() => window.__leoFakeVoice!.spoken().length)).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.__leoFakeVoice!.listening())).toBe(true);

  const sayings = ["Hi, I am backend developer for five years.", "I go to school yesterday.", "There was very much people."];
  for (const [i, s] of sayings.entries()) {
    await say(page, s);
    await expect(page.getByTestId("msg-assistant")).toHaveCount(i + 1, { timeout: 15_000 });
  }
  await expect(page.getByTestId("msg-user")).toHaveCount(3);
  // 답변 문장이 문장 단위로 TTS 됐다 (인사 + 답변 3개 × 2문장 이상)
  const spoken = await page.evaluate(() => window.__leoFakeVoice!.spoken());
  expect(spoken.length).toBeGreaterThanOrEqual(4);

  // 타이머 만료 → 리포트 화면
  await expect(page).toHaveURL(/\/history\/[a-z0-9]+\/report$/, { timeout: 40_000 });
  await expect(page.getByRole("heading", { name: report.pageTitle })).toBeVisible();
  await expect(page.getByTestId("score")).toHaveCount(4);
  await expect(page.getByTestId("interview-section")).toBeVisible();

  // 상대의 첫 인사가 대화 내용과 메시지 수에 들어간다(외부 피드백 1): 인사 1 + 내 말 3 + 답 3
  const conversationId = page.url().match(/\/history\/([a-z0-9]+)\/report$/)![1]!;
  await page.goto(`/history/${conversationId}`);
  await expect(page.getByRole("heading", { name: transcript.pageTitle })).toBeVisible();
  await expect(page.getByRole("log").getByText(THEMES.interview.openingLine)).toBeVisible();
  await page.goto("/history");
  await expect(page.getByTestId("history-list")).toContainText(common.messagesCount(7));
});

test("음소거와 끊기", async ({ page }) => {
  await login(page);
  await page.goto("/call");
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await selectTheme(page, "daily");
  await page.getByRole("button", { name: callSetup.next }).click();
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await page.getByTestId("start-call").click();
  await expect.poll(() => page.evaluate(() => window.__leoFakeVoice!.listening())).toBe(true);
  await page.getByRole("button", { name: callLive.mute, exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__leoFakeVoice!.listening())).toBe(false);
  await page.getByRole("button", { name: callLive.unmute }).click();
  await expect.poll(() => page.evaluate(() => window.__leoFakeVoice!.listening())).toBe(true);
  await say(page, "Hello! I just moved here last week.");
  await expect(page.getByTestId("msg-assistant")).toHaveCount(1, { timeout: 15_000 });
  await page.getByTestId("hangup").click();
  await expect(page).toHaveURL(/\/history\/[a-z0-9]+\/report$/, { timeout: 30_000 });
  await expect(page.getByTestId("interview-section")).toHaveCount(0);
});

test("음성 인식 미지원 브라우저는 텍스트 입력으로 대체한다", async ({ page }) => {
  await page.addInitScript(() => {
    window.__LEO_FAKE_VOICE = true;
    window.__LEO_FAKE_VOICE_SUPPORT = { stt: false, tts: true };
  });
  await login(page);
  await page.goto("/call");
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await page.getByRole("button", { name: callSetup.next }).click();
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await page.getByTestId("start-call").click();
  await expect(page.getByText(callLive.textModeNotice)).toBeVisible();
  await page.getByLabel(callLive.textInputLabel).fill("Nice to meet you.");
  await page.getByRole("button", { name: callLive.say }).click();
  await expect(page.getByTestId("msg-assistant")).toHaveCount(1, { timeout: 15_000 });
});
