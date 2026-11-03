import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { login } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__LEO_FAKE_VOICE = true;
  });
});

async function say(page: Page, text: string) {
  await page.evaluate((t) => window.__leoFakeVoice!.say(t), text);
}

test("포트폴리오 등록(텍스트·PDF) → 포트폴리오 면접 통화 → 리포트에 면접 항목과 기술 설명 점수", async ({ page }) => {
  await login(page);
  await page.goto("/portfolios");
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  const title = `E2E 포트폴리오 ${Date.now()}`;
  await page.getByLabel("제목").fill(title);
  await page.getByLabel("내용").fill("# Chat service\nI built a real-time chat backend with Node.js and Redis. Handled 10k concurrent users.");
  await page.getByRole("button", { name: "등록" }).click();
  await expect(page.getByRole("form", { name: "포트폴리오 등록" }).getByRole("status")).toContainText("등록 완료");
  await expect(page.getByTestId("portfolio-list")).toContainText(title);

  // PDF 업로드
  await page.getByLabel("PDF 업로드").check();
  await page.getByLabel("PDF 파일").setInputFiles(path.join(__dirname, "fixtures/sample.pdf"));
  await page.getByRole("button", { name: "등록" }).click();
  await expect(page.getByRole("form", { name: "포트폴리오 등록" }).getByRole("status")).toContainText('"sample" 등록 완료');

  // 포트폴리오 면접 통화
  await page.goto("/call");
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await page.getByLabel("테마").selectOption("portfolio");
  await page.getByLabel("포트폴리오").selectOption({ label: title });
  await page.getByLabel("테스트(20초)").check();
  await page.getByRole("button", { name: "다음" }).click();
  await expect(page).toHaveURL(/\/call\/[a-z0-9]+$/);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await page.getByTestId("start-call").click();
  await expect.poll(() => page.evaluate(() => window.__leoFakeVoice!.listening())).toBe(true);
  await say(page, "I am most proud of the chat service because it scaled to ten thousand users.");
  await expect(page.getByTestId("msg-assistant")).toHaveCount(1, { timeout: 15_000 });
  await page.getByTestId("hangup").click();
  await expect(page).toHaveURL(/\/history\/[a-z0-9]+\/report$/, { timeout: 30_000 });
  await expect(page.getByTestId("interview-section")).toBeVisible();
  await expect(page.getByTestId("score")).toHaveCount(5);
  await expect(page.getByText("기술 설명의 명확성")).toBeVisible();
  await expect(page.getByText(`포트폴리오: ${title}`)).toBeVisible();

  // 삭제
  await page.goto("/portfolios");
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: `${title} 삭제` }).click();
  await expect(page.getByTestId("portfolio-list")).not.toContainText(title);
});

test("남은 시간 1분 이하에서 10분 연장 버튼이 동작한다", async ({ page }) => {
  await login(page);
  await page.goto("/call");
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await page.getByLabel("테스트(20초)").check();
  await page.getByRole("button", { name: "다음" }).click();
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
  await page.getByTestId("start-call").click();
  await expect(page.getByTestId("timer")).toHaveText(/0:(1\d|20)/);
  await expect(page.getByTestId("extend")).toBeVisible();
  await page.getByTestId("extend").click();
  await expect(page.getByTestId("timer")).toHaveText(/10:[0-5]\d/);
  await expect(page.getByText("10:20 통화")).toBeVisible();
  // 연장 후 1분 이상 남았으므로 버튼이 사라진다
  await expect(page.getByTestId("extend")).toHaveCount(0);
  await page.getByTestId("hangup").click();
  await expect(page).toHaveURL(/\/history\/[a-z0-9]+\/report$/, { timeout: 30_000 });
});
