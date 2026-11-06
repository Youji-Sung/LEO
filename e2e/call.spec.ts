import { expect, test, type Page } from "@playwright/test";
import { callLive, callSetup, chat, common, errors, report, transcript } from "../src/content/ko";
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

test("마이크를 쓸 수 없게 되면 오류가 아니라 안내 하나로 글 입력으로 바꾼다", async ({ page }) => {
  await login(page);
  await page.goto("/call");
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await selectTheme(page, "daily");
  await page.getByRole("button", { name: callSetup.next }).click();
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await page.getByTestId("start-call").click();
  await expect.poll(() => page.evaluate(() => window.__leoFakeVoice!.listening())).toBe(true);
  // 브라우저가 마이크 권한 거부를 알려 온 상황(외부 피드백 4)
  await page.evaluate((m) => window.__leoFakeVoice!.fail(m, true), errors.voice.permissionDenied);
  const main = page.locator("main");
  await expect(main.getByRole("status").filter({ hasText: errors.voice.permissionDenied })).toBeVisible();
  await expect(main.getByRole("alert")).toHaveCount(0);
  await expect(main.getByText(callLive.textModeNotice)).toHaveCount(0);
  await page.getByLabel(callLive.textInputLabel).fill("Nice to meet you.");
  await page.getByRole("button", { name: callLive.say }).click();
  await expect(page.getByTestId("msg-assistant")).toHaveCount(1, { timeout: 15_000 });
});

test("보내지 못한 말은 남고 다시 보내기로 재전송한다", async ({ page }) => {
  await login(page);
  await page.goto("/call");
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await selectTheme(page, "free");
  await page.getByRole("button", { name: callSetup.next }).click();
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await page.getByTestId("start-call").click();
  await expect.poll(() => page.evaluate(() => window.__leoFakeVoice!.listening())).toBe(true);
  await say(page, "Hello MOCK_ERROR");
  const main = page.locator("main");
  await expect(main.getByRole("alert")).toBeVisible({ timeout: 15_000 });
  // 실패한 말풍선은 남고(외부 피드백 5) 다시 보내기 버튼이 있다
  await expect(page.getByTestId("msg-user")).toHaveCount(1);
  await expect(page.getByText(chat.failedLabel)).toBeVisible();
  const retry = main.getByRole("button", { name: common.retrySend });
  await expect(retry).toBeVisible();
  await retry.click();
  await expect(main.getByRole("alert")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("msg-user")).toHaveCount(1);
  // 다른 말을 하면 실패한 말풍선은 내려가고 대화가 이어진다
  await say(page, "Hello again!");
  await expect(page.getByTestId("msg-assistant")).toHaveCount(1, { timeout: 15_000 });
  await expect(page.getByTestId("msg-user")).toHaveCount(1);
  await expect(page.getByText(chat.failedLabel)).toHaveCount(0);
  await expect(main.getByRole("alert")).toHaveCount(0);
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

async function openCall(page: Page, review = false) {
  await login(page);
  await page.goto("/call");
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await page.getByRole("button", { name: callSetup.next }).click();
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  if (review) await page.getByLabel(callLive.reviewSpeech).check();
  await page.getByTestId("start-call").click();
  await expect.poll(() => page.evaluate(() => window.__leoFakeVoice!.listening())).toBe(true);
}

test("짧게 쉬거나 인식기가 재시작해도 말을 한 번으로 모아서 보낸다", async ({ page }) => {
  await openCall(page);
  await say(page, "I go");
  await expect(page.getByTestId("interim")).toContainText("I go");
  await page.waitForTimeout(1500);
  await expect(page.getByTestId("msg-user")).toHaveCount(0);
  await page.evaluate(() => window.__leoFakeVoice!.end());
  await expect.poll(() => page.evaluate(() => window.__leoFakeVoice!.listening())).toBe(true);
  await say(page, "to school yesterday.");
  await expect(page.getByTestId("msg-user")).toHaveCount(1);
  await expect(page.getByTestId("msg-user")).toHaveText("I go to school yesterday.");
  await expect(page.getByTestId("msg-assistant")).toHaveCount(1);
});

test("인식 내용을 실제 말한 문법으로 수정해 보내고 리포트 전사에 남긴다", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openCall(page, true);
  await say(page, "I went to school yesterday.");
  await page.waitForTimeout(3500);
  await expect(page.getByTestId("msg-user")).toHaveCount(0);
  await page.getByRole("button", { name: callLive.editSpeech }).click();
  const draft = page.getByLabel(callLive.draftLabel);
  await expect(draft).toHaveAttribute("autocorrect", "off");
  await expect(draft).toHaveAttribute("spellcheck", "false");
  await draft.fill("I go to school yesterday.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/voice-review-mobile.png", fullPage: true });
  await page.getByRole("button", { name: callLive.sendSpeech }).click();
  await expect(page.getByTestId("msg-user")).toHaveText("I go to school yesterday.");
  await expect(page.getByTestId("msg-assistant")).toHaveCount(1);
  await expect(page.getByTestId("hangup")).toBeInViewport();
  const id = page.url().split("/").at(-1)!;
  await page.getByTestId("hangup").click();
  await expect(page).toHaveURL(/\/report$/);
  await page.goto(`/history/${id}`);
  await expect(page.getByRole("log")).toContainText("I go to school yesterday.");
});

test("아이폰 방식의 재생 실패와 마이크 오류를 화면 이동 없이 복구한다", async ({ page }) => {
  await page.addInitScript(() => { window.__LEO_FAKE_VOICE_SUPPORT = { stt: true, tts: true, duplex: false }; });
  await openCall(page);
  const url = page.url();
  await page.evaluate(() => window.__leoFakeVoice!.failPlayback());
  await page.getByRole("button", { name: callLive.replay }).click();
  await expect(page.getByText(callLive.playbackError)).toBeVisible();
  await page.getByRole("button", { name: callLive.replay }).click();
  await expect(page.getByText(callLive.playbackError)).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__leoFakeVoice!.listening())).toBe(true);
  await page.evaluate((message) => window.__leoFakeVoice!.fail(message, true), errors.voice.permissionDenied);
  await expect(page.getByLabel(callLive.textInputLabel)).toBeVisible();
  await page.getByRole("button", { name: callLive.retryMic }).click();
  await expect.poll(() => page.evaluate(() => window.__leoFakeVoice!.listening())).toBe(true);
  await expect(page.getByLabel(callLive.textInputLabel)).toHaveCount(0);
  await expect(page).toHaveURL(url);
  await say(page, "There was very much people.");
  await page.getByRole("button", { name: callLive.sendSpeech }).click();
  await expect(page.getByTestId("msg-user")).toHaveText("There was very much people.");
  await expect(page.getByTestId("msg-assistant")).toHaveCount(1);
});
