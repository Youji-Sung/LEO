import { expect, test } from "@playwright/test";
import { login, gotoHydrated } from "./helpers";
import { callSetup, callLive } from "../src/content/ko";

test("리포트 표현을 익히고 같은 표현을 다음 채팅에 연결한다", async ({ page }) => {
  await login(page);
  const created = await page.request.post("/api/conversations", {
    data: { kind: "chat", theme: "work" },
  });
  const { conversation } = await created.json();
  await page.request.post(`/api/conversations/${conversation.id}/messages`, {
    data: { content: "The documentation was very good." },
  });
  await page.request.post(`/api/conversations/${conversation.id}/report`);
  await expect
    .poll(async () =>
      (await page.request.get(`/api/conversations/${conversation.id}/report`)).status(),
    )
    .toBe(200);
  await gotoHydrated(page, `/history/${conversation.id}/report`);
  await page
    .locator("#vocabulary")
    .getByRole("button", { name: "학습할 표현에 담기" })
    .first()
    .click();
  await expect(page.getByText("학습할 표현에 담았어요.")).toBeVisible();
  await page.reload();
  await expect(page.getByText("학습할 표현에 담았어요.")).toBeVisible();
  await gotoHydrated(page, "/learn");
  await page.getByRole("button", { name: "이어 익히기" }).first().click();
  await expect(page.getByRole("heading", { name: "의미와 쓰임" })).toBeVisible();
  await page.getByRole("button", { name: "뜻과 쓰임을 확인했어요" }).click();
  await expect(page.getByRole("heading", { name: "도움받아 익히기" })).toBeVisible();
  await page.getByLabel("빈칸에 들어갈 표현").fill("excellent");
  await page.getByRole("button", { name: "답과 비교하기" }).click();
  await expect(page.getByText("표현이 맞아요. 문장 전체를 한 번 읽어 보세요.")).toBeVisible();
  await page.getByRole("button", { name: "스스로 떠올렸어요" }).click();
  await expect(page.getByRole("heading", { name: "내 상황으로 바꾸기" })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "이어 익히기" }).first().click();
  await expect(page.getByRole("heading", { name: "내 상황으로 바꾸기" })).toBeVisible();
  await page.getByLabel("내가 떠올린 표현 또는 문장").fill("Our test coverage was excellent.");
  await page.getByRole("button", { name: "답과 비교하기" }).click();
  await page.getByRole("button", { name: "스스로 떠올렸어요" }).click();
  await expect(page.getByRole("heading", { name: "스스로 떠올리기" })).toBeFocused();
  await page.getByRole("button", { name: "힌트 보기" }).click();
  await expect(page.getByText("e …", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "힌트 보기" }).click();
  await page.getByRole("button", { name: "힌트 보기" }).click();
  await expect(page.getByRole("button", { name: "힌트를 모두 봤어요" })).toBeDisabled();
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("link", { name: "채팅으로 이어가기" }).click();
  await expect(page.getByText(/이어 연습할 표현: excellent/)).toBeVisible();
  await page.getByRole("button", { name: "채팅 시작하기" }).click();
  await expect(page).toHaveURL(/\/chat\/[a-z0-9]+$/);
});

test("의심되는 용어만 확인하고 실제 문법과 인식 원문은 보존한다", async ({ page }) => {
  await page.addInitScript(() => {
    window.__LEO_FAKE_VOICE = true;
  });
  await login(page);
  await gotoHydrated(page, "/call");
  await page.getByRole("button", { name: callSetup.micCheck }).click();
  await page.getByRole("button", { name: callSetup.next }).click();
  await expect(page).toHaveURL(/\/call\/[a-z0-9]+$/);
  const id = page.url().split("/").pop()!;
  await page.getByTestId("start-call").click();
  await page.waitForFunction(() => window.__leoFakeVoice?.listening());
  await page.evaluate(() =>
    window.__leoFakeVoice!.say("I am a front and engineer. He don't understand my question."),
  );
  await expect(
    page.getByRole("button", { name: "front and engineer → frontend engineer" }),
  ).toBeVisible();
  await page.waitForTimeout(3500);
  await expect(page.getByTestId("msg-user")).toHaveCount(0);
  await page.getByRole("button", { name: "front and engineer → frontend engineer" }).click();
  await expect(page.getByLabel(callLive.draftLabel)).toHaveValue(
    "I am a frontend engineer. He don't understand my question.",
  );
  await page.getByRole("button", { name: callLive.sendSpeech }).click();
  await expect(page.getByTestId("msg-assistant")).toHaveCount(1);
  await gotoHydrated(page, `/history/${id}`);
  await page.getByText("음성 인식 기록").click();
  await expect(
    page.getByText("인식 원문: I am a front and engineer. He don't understand my question."),
  ).toBeVisible();
  await expect(page.getByText("전송 전에 확인한 문장이에요.")).toBeVisible();
});
