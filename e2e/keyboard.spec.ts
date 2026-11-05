import { expect, test, type Locator, type Page } from "@playwright/test";
import { auth, callSetup, chat, common, nav, portfolio, report } from "../src/content/ko";
import { DIRECTIONS } from "../src/lib/direction";
import { gotoHydrated, SEED_EMAIL, SEED_PASSWORD } from "./helpers";

// WCAG 2.1.1: 첫 page.goto 뒤에는 page.keyboard 로만 조작한다(click/fill/check/selectOption 금지).
test.use({ viewport: { width: 1280, height: 800 } });

// 세 흐름을 기본 디자인과 디자인 시안 셋(쿠키 leo_direction)으로 각각 돈다. 포커스 순서와 이름은 시안과 무관해야 한다.
const VARIANTS = ["basic", ...DIRECTIONS] as const;

test.afterAll(async ({ request }) => {
  await request.post("/api/auth/login", { data: { email: SEED_EMAIL, password: SEED_PASSWORD } });
  await request.patch("/api/settings", { data: { direction: "basic" } });
});

const HYDRATED = () => document.documentElement.dataset.hydrated === "1";

async function isFocused(target: Locator): Promise<boolean> {
  if ((await target.count()) === 0) return false;
  return target.evaluate((el) => el === document.activeElement, undefined, { timeout: 2_000 });
}

// Tab(또는 Shift+Tab)을 대상에 포커스가 갈 때까지 누른다. max 안에 못 가면 접근성 결함으로 보고 실패시킨다.
async function tabUntil(
  page: Page,
  target: Locator,
  opts: { shift?: boolean; max?: number } = {},
): Promise<void> {
  const key = opts.shift ? "Shift+Tab" : "Tab";
  const max = opts.max ?? 40;
  for (let i = 0; i < max; i++) {
    await page.keyboard.press(key);
    if (await isFocused(target)) return;
  }
  const active = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}` : "none";
  });
  throw new Error(`${key} ${max}번 안에 대상에 포커스가 가지 않았어요 (마지막 포커스: ${active})`);
}

// 라디오 그룹 안에서 화살표로 대상이 체크될 때까지 이동한다.
async function arrowUntilChecked(
  page: Page,
  input: Locator,
  key: "ArrowDown" | "ArrowUp" | "ArrowRight" | "ArrowLeft",
  max = 8,
): Promise<void> {
  for (let i = 0; i < max; i++) {
    if (await input.isChecked()) return;
    await page.keyboard.press(key);
  }
  await expect(input).toBeChecked();
}

async function keyboardLogin(page: Page): Promise<void> {
  await gotoHydrated(page, "/login");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel(auth.email)).toBeFocused();
  await page.keyboard.type(SEED_EMAIL);
  await page.keyboard.press("Tab");
  await expect(page.getByLabel(auth.password)).toBeFocused();
  await page.keyboard.type(SEED_PASSWORD);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/$/);
  await page.waitForFunction(HYDRATED);
}

// 클라이언트 내비게이션 뒤 RouteFocus 가 <main> 으로 포커스를 옮기기를 기다린다.
async function waitForMainFocus(page: Page): Promise<void> {
  await page.waitForFunction(() => document.activeElement === document.querySelector("main"));
}

// 헤더 주 메뉴 링크로 이동한다. 포커스가 <main> 에 있으므로 Shift+Tab 으로 거슬러 올라간다.
async function navigateViaHeader(page: Page, label: string, url: RegExp): Promise<void> {
  const link = page
    .getByRole("navigation", { name: nav.menuLabel })
    .getByRole("link", { name: label });
  await tabUntil(page, link, { shift: true, max: 12 });
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(url);
  await page.waitForFunction(HYDRATED);
  await waitForMainFocus(page);
}

async function say(page: Page, text: string): Promise<void> {
  await page.evaluate((t) => window.__leoFakeVoice!.say(t), text);
}

async function startCallByKeyboard(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/call\/[a-z0-9]+$/);
  await page.waitForFunction(HYDRATED);
  await waitForMainFocus(page);
  const start = page.getByTestId("start-call");
  await tabUntil(page, start);
  await expect(start).toBeFocused();
  await page.keyboard.press("Enter");
  await expect.poll(() => page.evaluate(() => window.__leoFakeVoice!.listening())).toBe(true);
}

async function hangupByKeyboard(page: Page): Promise<void> {
  const hangup = page.getByTestId("hangup");
  await tabUntil(page, hangup);
  await expect(hangup).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/history\/[a-z0-9]+\/report$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: report.pageTitle })).toBeVisible();
}

// 통화 시간 그룹: 체크된 라디오에 Tab 으로 들어가 화살표로 "테스트 20초"(value=0) 까지 이동한다.
async function chooseTestDuration(page: Page): Promise<void> {
  const checked = page.locator('input[name="minutes"]:checked');
  await tabUntil(page, checked);
  await arrowUntilChecked(page, page.locator('input[name="minutes"][value="0"]'), "ArrowRight");
}

for (const direction of VARIANTS) {
  test.describe(`디자인 ${direction}`, () => {
    // 로그인 응답이 저장된 시안으로 쿠키를 주므로, 설정에 먼저 저장해 두고 쿠키를 비운 채 키보드 로그인을 한다.
    test.beforeEach(async ({ context, baseURL }) => {
      await context.request.post(`${baseURL}/api/auth/login`, {
        data: { email: SEED_EMAIL, password: SEED_PASSWORD },
      });
      const saved = await context.request.patch(`${baseURL}/api/settings`, { data: { direction } });
      expect(saved.ok()).toBe(true);
      await context.clearCookies();
    });

    test("키보드만으로 로그인 → 채팅 → 리포트", async ({ page }) => {
      await keyboardLogin(page);
      await navigateViaHeader(page, nav.chat, /\/chat$/);

      // 테마 그룹: Tab 은 체크된 라디오(free)에 멈추고 화살표로 선택을 옮긴다
      const free = page.locator('input[name="theme"][value="free"]');
      await tabUntil(page, free);
      await expect(free).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(page.locator('input[name="theme"][value="interview"]')).toBeChecked();

      const hints = page.getByRole("checkbox", { name: chat.hintsToggle });
      const hintsBefore = await hints.isChecked();
      await tabUntil(page, hints);
      await page.keyboard.press("Space");
      await expect(hints).toBeChecked({ checked: !hintsBefore });

      const start = page.getByRole("button", { name: chat.start });
      await tabUntil(page, start);
      await expect(start).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/chat\/[a-z0-9]+$/);
      await waitForMainFocus(page);

      const input = page.getByLabel(chat.inputLabel);
      await tabUntil(page, input);
      await expect(input).toBeFocused();
      await page.keyboard.type("I go to school yesterday.");
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("msg-assistant")).toHaveCount(1, { timeout: 15_000 });
      await expect(page.getByTestId("streaming")).toHaveCount(0);

      // 보낸 뒤 포커스는 입력창으로 돌아온다
      await expect(input).toBeFocused();
      await page.keyboard.type("There was very much people.");
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("msg-assistant")).toHaveCount(2, { timeout: 15_000 });
      await expect(page.getByTestId("streaming")).toHaveCount(0);
      await expect(page.getByTestId("msg-user")).toHaveCount(2);

      const makeReport = page.getByRole("button", { name: chat.makeReport });
      await tabUntil(page, makeReport, { shift: true, max: 10 });
      await expect(makeReport).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/history\/[a-z0-9]+\/report$/, { timeout: 30_000 });
      await expect(page.getByRole("heading", { name: report.pageTitle })).toBeVisible();
      await expect(page.getByTestId("score")).toHaveCount(4);

      // 목차 첫 링크로 이동
      await waitForMainFocus(page);
      const firstToc = page.getByRole("navigation", { name: report.toc }).getByRole("link").first();
      await tabUntil(page, firstToc);
      await expect(firstToc).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/report#summary$/);
    });

    test("키보드만으로 로그인 → 통화 → 리포트", async ({ page }) => {
      await page.addInitScript(() => {
        window.__LEO_FAKE_VOICE = true;
      });
      await keyboardLogin(page);
      await navigateViaHeader(page, nav.call, /\/call$/);

      // 테마 그룹: 기본 선택(면접)에 포커스가 멈춘다
      const interview = page.locator('input[name="theme"][value="interview"]');
      await tabUntil(page, interview);
      await expect(interview).toBeFocused();
      await expect(interview).toBeChecked();

      await chooseTestDuration(page);

      const micCheck = page.getByRole("button", { name: callSetup.micCheck });
      await tabUntil(page, micCheck);
      await expect(micCheck).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("mic-status")).toContainText(callSetup.micGranted);

      const next = page.getByRole("button", { name: callSetup.next });
      await tabUntil(page, next);
      await expect(next).toBeFocused();
      await page.keyboard.press("Enter");

      await startCallByKeyboard(page);
      await say(page, "Hi, I am backend developer for five years.");
      await expect(page.getByTestId("msg-assistant")).toHaveCount(1, { timeout: 15_000 });
      await say(page, "I go to school yesterday.");
      await expect(page.getByTestId("msg-assistant")).toHaveCount(2, { timeout: 15_000 });

      await hangupByKeyboard(page);
      await expect(page.getByTestId("score")).toHaveCount(4);
      await expect(page.getByTestId("interview-section")).toBeVisible();
    });

    test("키보드만으로 포트폴리오 추가 → 포트폴리오 면접 통화 → 삭제", async ({ page }) => {
      await page.addInitScript(() => {
        window.__LEO_FAKE_VOICE = true;
      });
      await keyboardLogin(page);
      await navigateViaHeader(page, nav.portfolios, /\/portfolios$/);

      const title = `키보드 포트폴리오 ${Date.now()}`;
      const titleField = page.getByLabel(portfolio.title);
      await tabUntil(page, titleField);
      await expect(titleField).toBeFocused();
      await page.keyboard.type(title);
      await page.keyboard.press("Tab");
      const content = page.getByLabel(portfolio.content);
      await expect(content).toBeFocused();
      await page.keyboard.type("# Chat service\n");
      await page.keyboard.type("I built a real-time chat backend with Node.js and Redis.");
      await expect(content).toHaveValue(/Chat service\nI built/);

      const submit = page.getByRole("button", { name: portfolio.submit });
      await tabUntil(page, submit);
      await expect(submit).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("form", { name: portfolio.formLabel }).getByRole("status"),
      ).toContainText("추가했어요");
      await expect(page.getByTestId("portfolio-list")).toContainText(title);

      // 포트폴리오 면접 통화 설정
      await navigateViaHeader(page, nav.call, /\/call$/);
      const checkedTheme = page.locator('input[name="theme"]:checked');
      await tabUntil(page, checkedTheme);
      await arrowUntilChecked(
        page,
        page.locator('input[name="theme"][value="portfolio"]'),
        "ArrowDown",
      );

      const select = page.locator("select#call-portfolio");
      await page.keyboard.press("Tab");
      await expect(select).toBeFocused();
      const selectedTitle = () =>
        select.evaluate((el: HTMLSelectElement) => el.selectedOptions[0]?.textContent ?? "");
      for (let i = 0; i < 10 && (await selectedTitle()) !== title; i++) {
        await page.keyboard.press("ArrowDown");
      }
      for (let i = 0; i < 10 && (await selectedTitle()) !== title; i++) {
        await page.keyboard.press("ArrowUp");
      }
      await expect(select.locator("option:checked")).toHaveText(title);

      await chooseTestDuration(page);

      const next = page.getByRole("button", { name: callSetup.next });
      await tabUntil(page, next);
      await expect(next).toBeFocused();
      await page.keyboard.press("Enter");

      await startCallByKeyboard(page);
      await say(
        page,
        "I am most proud of the chat service because it scaled to ten thousand users.",
      );
      await expect(page.getByTestId("msg-assistant")).toHaveCount(1, { timeout: 15_000 });

      await hangupByKeyboard(page);
      await expect(page.getByText(report.portfolioMeta(title))).toBeVisible();
      await expect(page.getByTestId("score")).toHaveCount(5);

      // 삭제: 다이얼로그는 취소 버튼에 먼저 포커스, Tab 으로 삭제
      await navigateViaHeader(page, nav.portfolios, /\/portfolios$/);
      const deleteButton = page.getByRole("button", { name: portfolio.deleteLabel(title) });
      await tabUntil(page, deleteButton);
      await expect(deleteButton).toBeFocused();
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("button", { name: common.cancel })).toBeFocused();
      await page.keyboard.press("Tab");
      const confirm = dialog.getByRole("button", { name: portfolio.deleteAction });
      await expect(confirm).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(dialog).toBeHidden();
      await expect(page.getByText(title, { exact: true })).toHaveCount(0);
    });
  });
}
