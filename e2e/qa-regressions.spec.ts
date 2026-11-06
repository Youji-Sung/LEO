import { expect, test, type Page } from "@playwright/test";
import { callLive, chat, nav, notFound, report, settings } from "../src/content/ko";
import { gotoHydrated, login } from "./helpers";

async function create(page: Page, kind: "chat" | "call") {
  const response = await page.request.post("/api/conversations", {
    data: { kind, theme: "daily", hintsEnabled: true, ...(kind === "call" ? { durationMin: 10 } : {}) },
  });
  expect(response.status()).toBe(201);
  const { conversation } = await response.json();
  await gotoHydrated(page, `/${kind}/${conversation.id}`);
  return conversation.id as string;
}

async function send(page: Page, content: string, count = 1) {
  await page.getByLabel(chat.inputLabel).fill(content);
  await page.getByRole("button", { name: chat.send, exact: true }).click();
  await expect(page.getByTestId("msg-assistant")).toHaveCount(count);
  await expect(page.getByTestId("streaming")).toHaveCount(0);
}

test("D1 채팅: 같은 틱의 두 클릭은 한 턴이고 나중에 같은 문장을 다시 보내는 것은 허용한다", async ({ page }) => {
  await login(page);
  const id = await create(page, "chat");
  let posts = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith(`/api/conversations/${id}/messages`)) posts++;
  });
  await page.getByLabel(chat.inputLabel).fill("I go to school yesterday.");
  await page.getByRole("button", { name: chat.send, exact: true }).evaluate((button: HTMLButtonElement) => {
    button.click(); button.click();
  });
  await expect(page.getByTestId("msg-assistant")).toHaveCount(1);
  await expect(page.getByTestId("streaming")).toHaveCount(0);
  expect(posts).toBe(1);
  await page.reload();
  await expect(page.getByTestId("msg-user")).toHaveCount(1);
  await expect(page.getByTestId("msg-assistant")).toHaveCount(1);
  await send(page, "I go to school yesterday.", 2);
  expect(posts).toBe(2);
});

test("D1 통화: 텍스트의 같은 틱 연속 클릭은 한 번만 저장한다", async ({ page }) => {
  await page.addInitScript(() => {
    window.__LEO_FAKE_VOICE = true;
    window.__LEO_FAKE_VOICE_SUPPORT = { stt: false, tts: false };
  });
  await login(page);
  const id = await create(page, "call");
  await page.getByTestId("start-call").click();
  let posts = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith(`/api/conversations/${id}/messages`)) posts++;
  });
  await page.getByLabel(callLive.textInputLabel).fill("I worked on the queue yesterday.");
  await page.getByRole("button", { name: callLive.say, exact: true }).evaluate((button: HTMLButtonElement) => {
    button.click(); button.click();
  });
  await expect(page.getByTestId("msg-assistant")).toHaveCount(1);
  await expect(page.getByTestId("streaming")).toHaveCount(0);
  expect(posts).toBe(1);
  await page.reload();
  await page.getByTestId("start-call").click();
  await expect(page.getByTestId("msg-user")).toHaveCount(1);
  await expect(page.getByTestId("msg-assistant")).toHaveCount(1);
  await page.getByLabel(callLive.textInputLabel).fill("I worked on the queue yesterday.");
  await page.getByRole("button", { name: callLive.say, exact: true }).click();
  await expect(page.getByTestId("msg-assistant")).toHaveCount(2);
  expect(posts).toBe(2);
});

test("D2 생성 중 새로고침해도 상태를 복원하고 POST 없이 리포트로 이동한다", async ({ page }) => {
  await login(page);
  const id = await create(page, "chat");
  await send(page, "I built a queue yesterday. MOCK_SLOW_REPORT");
  let posts = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith(`/api/conversations/${id}/report`)) posts++;
  });
  await page.getByRole("button", { name: chat.makeReport, exact: true }).click();
  await expect.poll(async () => (await page.request.get(`/api/conversations/${id}/report`)).status()).toBe(202);
  await page.reload();
  await expect(page.getByText(chat.reportPending)).toBeVisible();
  await expect(page.getByRole("button", { name: chat.makingReport, exact: true })).toBeDisabled();
  await expect(page.getByLabel(chat.inputLabel)).toBeDisabled();
  await expect(page).toHaveURL(new RegExp(`/history/${id}/report$`), { timeout: 30_000 });
  await expect(page.getByText(report.limitedEvidence)).toBeVisible();
  expect(posts).toBe(1);
});

test("D2 새로고침 뒤 생성이 실패하면 자동 재생성 없이 안내하고 재시도를 허용한다", async ({ page }) => {
  await login(page);
  const id = await create(page, "chat");
  await send(page, "MOCK_SLOW_REPORT MOCK_INVALID_REPORT");
  let posts = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith(`/api/conversations/${id}/report`)) posts++;
  });
  await page.getByRole("button", { name: chat.makeReport, exact: true }).click();
  await expect.poll(async () => (await page.request.get(`/api/conversations/${id}/report`)).status()).toBe(202);
  await page.reload();
  await expect(page.getByText(report.interrupted)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: chat.makeReport, exact: true })).toBeEnabled();
  await expect(page.getByLabel(chat.inputLabel)).toBeEnabled();
  expect(posts).toBe(1);
});

test("D3 현재 발화에 맞는 힌트만 보이고 올바른 후속 문장에는 지난 힌트가 붙지 않는다", async ({ page }) => {
  await login(page);
  await create(page, "chat");
  await send(page, "I go to school yesterday.");
  await expect(page.getByTestId("hint")).toHaveCount(1);
  await send(page, "A flat white, please.", 2);
  await send(page, "Does the cake contain nuts?", 3);
  await expect(page.getByTestId("hint")).toHaveCount(1);
  await page.reload();
  await expect(page.getByTestId("hint")).toHaveCount(1);
});

test("D4 디자인을 바꿔도 미저장 테마·힌트·통화 길이가 유지되고 함께 저장된다", async ({ page }) => {
  await login(page);
  await page.request.patch("/api/settings", { data: { theme: "system", direction: "basic", hintsDefault: false, defaultCallMinutes: 10 } });
  try {
    await gotoHydrated(page, "/settings");
    await page.locator('input[name="theme"][value="dark"]').check();
    await page.getByLabel(settings.hintsDefault, { exact: true }).check();
    await page.locator("#default-minutes").selectOption("20");
    await page.locator('input[name="direction"][value="study"]').check();
    await expect(page.locator("html")).toHaveAttribute("data-direction", "study");
    await expect(page.locator('input[name="theme"][value="dark"]')).toBeChecked();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByLabel(settings.hintsDefault, { exact: true })).toBeChecked();
    await expect(page.locator("#default-minutes")).toHaveValue("20");
    await page.getByRole("button", { name: settings.save, exact: true }).click();
    await expect(page.getByText(settings.saved)).toBeVisible();
    await page.reload();
    await expect(page.locator('input[name="theme"][value="dark"]')).toBeChecked();
    await expect(page.locator('input[name="direction"][value="study"]')).toBeChecked();
    await expect(page.locator("#default-minutes")).toHaveValue("20");
    const { settings: saved } = await (await page.request.get("/api/settings")).json();
    expect(saved).toMatchObject({ theme: "dark", direction: "study", hintsDefault: true, defaultCallMinutes: 20 });
  } finally {
    await page.request.patch("/api/settings", { data: { theme: "system", direction: "basic", hintsDefault: false, defaultCallMinutes: 10 } });
  }
});

test("D5 모바일 메뉴는 Escape로 닫히고 메뉴 버튼으로 포커스가 돌아온다", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page);
  await page.getByRole("button", { name: nav.openMenu, exact: true }).click();
  await page.locator("#site-nav").getByRole("link").first().focus();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: nav.openMenu, exact: true })).toBeFocused();
  await expect(page.locator("header")).toHaveAttribute("data-open", "false");
});

test("D6 없는 경로와 대화는 한국어 안내와 홈 복귀 링크를 제공한다", async ({ page }) => {
  await login(page);
  for (const path of ["/qa-missing-page", "/chat/qa-missing", "/call/qa-missing", "/history/qa-missing", "/history/qa-missing/report"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: notFound.title })).toBeVisible();
    await expect(page.getByRole("link", { name: notFound.home })).toHaveAttribute("href", "/");
  }
  await page.getByRole("link", { name: notFound.home }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("D7 진행 중 통화는 새로고침 직후부터 남은 시간과 이어 하기 안내를 보여 준다", async ({ page }) => {
  await page.addInitScript(() => { window.__LEO_FAKE_VOICE = true; });
  await login(page);
  const id = await create(page, "call");
  await page.getByTestId("start-call").click();
  await expect.poll(async () => {
    const { conversation } = await (await page.request.get(`/api/conversations/${id}`)).json();
    return conversation.messages.length;
  }).toBeGreaterThan(0);
  await expect(page.getByTestId("timer")).not.toHaveText("10:00");
  await page.reload();
  await expect(page.getByText(callLive.resumeTitle)).toBeVisible();
  await expect(page.getByTestId("start-call")).toHaveText(callLive.resume);
  await expect(page.getByTestId("timer")).not.toHaveText("10:00");
  const before = await page.getByTestId("timer").textContent();
  await expect.poll(() => page.getByTestId("timer").textContent()).not.toBe(before);
  await page.getByTestId("start-call").click();
  await expect.poll(() => page.evaluate(() => window.__leoFakeVoice!.listening())).toBe(true);
  await expect(page.getByTestId("timer")).not.toHaveText("10:00");
});
