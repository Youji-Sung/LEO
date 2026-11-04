/*
 * 모든 화면·주요 상태를 1280px·390px, 라이트·다크로 찍는다. 모의 Claude(CLAUDE_MOCK=1)와 가짜 VoiceAdapter 로
 * 자체 Next 개발 서버를 띄우므로 실제 API 는 호출하지 않는다.
 *
 *   npx tsx scripts/screenshots.ts --phase before|after [--axe] [--only call] [--reduced-motion] [--port 3150]
 *   npx tsx scripts/screenshots.ts --direction study|stage|console [--axe] [--port 3151]   (시각 방향 시안)
 *
 * 출력: docs/design/screenshots/{phase}/{상태}--{폭}-{light|dark}.png, index.md, (--axe) axe.json·axe.md
 *       --direction 이면 docs/design/directions/{이름}/shots/
 * Linux/macOS 기준(npx 를 셸로 실행한다).
 */
import { execSync, spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import type { AxeResults } from "axe-core";
import {
  auth,
  callLive,
  callSetup,
  chat,
  common,
  errors,
  portfolio,
  report,
  settings,
} from "../src/content/ko";
import { DIRECTION_COOKIE, isDirection } from "../src/lib/direction";

type Phase = "before" | "after";
type Scheme = "light" | "dark";
type Variant = { name: string; width: number; height: number; scheme: Scheme; mobile: boolean };

const argv = process.argv.slice(2);
function flag(name: string): boolean {
  return argv.includes(`--${name}`);
}
function opt(name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
}

const phase = (opt("phase") ?? "before") as Phase;
if (phase !== "before" && phase !== "after") throw new Error("--phase 는 before 또는 after");
// --direction study|stage|console : 시각 방향 시안(docs/design/directions/<이름>/shots/)을 찍는다.
// 쿠키 leo_direction 을 넣고, 시안 비교용 화면 세트(00-understanding.md 6절)만 찍는다(--only 로 바꿀 수 있다).
const direction = opt("direction");
if (direction !== undefined && !isDirection(direction))
  throw new Error("--direction 은 study, stage, console 중 하나");
const DIRECTION_SET = [
  "login",
  "home",
  "call-setup",
  "call-idle",
  "call-live",
  "chat-hints",
  "report-chat-interview",
  "history",
  "settings",
];
const runAxe = flag("axe");
const reducedMotion = flag("reduced-motion");
const only = opt("only");
const onlyList = only
  ? only
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
  : direction
    ? DIRECTION_SET
    : [];
function wanted(id: string): boolean {
  return (
    onlyList.length === 0 ||
    onlyList.includes("all") ||
    onlyList.some((o) => (direction ? id === o : id.includes(o)))
  );
}
const PORT = Number(opt("port") ?? 3150);
const BASE = `http://localhost:${PORT}`;
const ROOT = process.cwd();
const label = direction ?? phase;
const OUT = direction
  ? path.join(ROOT, "docs", "design", "directions", direction, "shots")
  : path.join(
      ROOT,
      "docs",
      "design",
      "screenshots",
      phase + (reducedMotion ? "-reduced-motion" : "") + (opt("widths") ? "-widths" : ""),
    );
// 시안 촬영은 셋이 동시에 돌 수 있으므로 DB 파일과 Next 빌드 폴더를 포트별로 나눈다.
const DB_FILE = direction ? `shots-${PORT}.db` : "shots.db";
const EMAIL = "dev1@leo.local";
const PASSWORD = process.env.SEED_USER_PASSWORD ?? "leo-pass-1234";

const DEFAULT_VARIANTS: Variant[] = [
  { name: "1280-light", width: 1280, height: 800, scheme: "light", mobile: false },
  { name: "1280-dark", width: 1280, height: 800, scheme: "dark", mobile: false },
  { name: "390-light", width: 390, height: 844, scheme: "light", mobile: true },
  { name: "390-dark", width: 390, height: 844, scheme: "dark", mobile: true },
];
// --widths 360,640,768 : 반응형·확대 검증용(라이트만). 640 은 1280 창의 200% 확대와 같은 CSS 폭이다.
const widthsOpt = opt("widths");
const VARIANTS: Variant[] = widthsOpt
  ? widthsOpt.split(",").map((w) => {
      const width = Number(w.trim());
      return {
        name: `${width}-light`,
        width,
        height: width < 700 ? 844 : 900,
        scheme: "light" as const,
        mobile: width < 700,
      };
    })
  : DEFAULT_VARIANTS;
// 가로 스크롤 검사 결과(상태 × 폭)
const overflow: { shot: string; variant: string; scrollWidth: number; innerWidth: number }[] = [];

// ---------- 서버 ----------
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function serverEnv(extra: Record<string, string>): NodeJS.ProcessEnv {
  return {
    ...process.env,
    DATABASE_URL: `file:./${DB_FILE}`,
    AUTH_SECRET: process.env.AUTH_SECRET || "shots-secret-shots-secret-shots-secret-00",
    SEED_USER_PASSWORD: PASSWORD,
    LEO_ALLOW_SHORT_CALLS: "1",
    LEO_ALLOW_SIGNUP: "1",
    CLAUDE_MOCK: "1",
    ...(direction ? { NEXT_DIST_DIR: `.next-shots-${PORT}` } : {}),
    ...extra,
  };
}

function prepareDb(): void {
  for (const f of [DB_FILE, `${DB_FILE}-journal`]) rmSync(path.join(ROOT, f), { force: true });
  const env = serverEnv({});
  execSync("npx prisma migrate deploy", { cwd: ROOT, env, stdio: "pipe" });
  execSync("npx tsx prisma/seed.ts", { cwd: ROOT, env, stdio: "pipe" });
}

async function startServer(extra: Record<string, string>): Promise<ChildProcess> {
  const child = spawn("npx", ["next", "dev", "--port", String(PORT)], {
    cwd: ROOT,
    env: serverEnv(extra),
    shell: true,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", () => undefined);
  child.stderr?.on("data", (d: Buffer) => {
    const s = d.toString();
    if (/error/i.test(s)) process.stderr.write(s);
  });
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/login`, { redirect: "manual" });
      if (res.status === 200) return child;
    } catch {
      // 아직 안 뜸
    }
    await sleep(500);
  }
  stopServer(child);
  throw new Error("개발 서버가 180초 안에 뜨지 않았습니다.");
}

function stopServer(child: ChildProcess): void {
  if (child.pid === undefined) return;
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    try {
      child.kill("SIGTERM");
    } catch {
      // 이미 종료됨
    }
  }
}

// ---------- 브라우저 ----------
type Fixtures = {
  chatHintsId: string;
  reportChatId: string;
  reportErrorId: string;
  portfolioId: string;
};

type AxeRecord = { shot: string; variant: string; violations: AxeResults["violations"] };

type Ctx = {
  page: Page;
  context: BrowserContext;
  variant: Variant;
  fixtures: Fixtures;
  shot: (name: string) => Promise<void>;
};

type State = {
  id: string;
  title: string;
  // "anon": 로그인 전, "auth": 로그인 후
  auth: "anon" | "auth";
  run: (c: Ctx) => Promise<void>;
};

const index: { name: string; title: string }[] = [];
const axeRecords: AxeRecord[] = [];

async function hydrated(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
}

async function go(page: Page, url: string): Promise<void> {
  await page.goto(`${BASE}${url}`);
  await hydrated(page);
}

async function newContext(browser: Browser, v: Variant): Promise<BrowserContext> {
  const context = await browser.newContext({
    viewport: { width: v.width, height: v.height },
    deviceScaleFactor: 1,
    colorScheme: v.scheme,
    isMobile: v.mobile,
    hasTouch: v.mobile,
    reducedMotion: reducedMotion ? "reduce" : "no-preference",
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    baseURL: BASE,
  });
  await context.addInitScript(() => {
    window.__LEO_FAKE_VOICE = true;
  });
  if (direction) {
    await context.addCookies([
      { name: DIRECTION_COOKIE, value: direction, url: BASE, sameSite: "Lax" },
    ]);
  }
  return context;
}

async function login(context: BrowserContext): Promise<void> {
  const res = await context.request.post(`${BASE}/api/auth/login`, {
    data: { email: EMAIL, password: PASSWORD },
  });
  if (!res.ok()) throw new Error(`로그인 실패 ${res.status()}`);
}

async function api<T>(
  context: BrowserContext,
  method: "post" | "patch",
  url: string,
  data?: unknown,
): Promise<T> {
  const res = await context.request[method](`${BASE}${url}`, { data });
  const text = await res.text();
  if (!res.ok())
    throw new Error(`${method.toUpperCase()} ${url} → ${res.status()} ${text.slice(0, 200)}`);
  // NDJSON(메시지 전송)은 본문을 끝까지 읽기만 하면 된다.
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined as T;
  }
}

async function createConversation(
  context: BrowserContext,
  body: Record<string, unknown>,
): Promise<string> {
  const r = await api<{ conversation: { id: string } }>(
    context,
    "post",
    "/api/conversations",
    body,
  );
  return r.conversation.id;
}

async function sendMessage(context: BrowserContext, id: string, content: string): Promise<void> {
  await api(context, "post", `/api/conversations/${id}/messages`, { content });
}

async function makeFixtures(context: BrowserContext): Promise<Fixtures> {
  const chatHintsId = await createConversation(context, {
    kind: "chat",
    theme: "interview",
    hintsEnabled: true,
  });
  for (const s of [
    "Hi, I am backend developer for five years.",
    "I go to school yesterday.",
    "There was very much people.",
  ]) {
    await sendMessage(context, chatHintsId, s);
  }
  const reportChatId = await createConversation(context, {
    kind: "chat",
    theme: "interview",
    hintsEnabled: false,
  });
  await sendMessage(context, reportChatId, "I go to school yesterday.");
  await sendMessage(context, reportChatId, "There was very much people.");
  await api(context, "post", `/api/conversations/${reportChatId}/report`);
  const reportErrorId = await createConversation(context, {
    kind: "chat",
    theme: "free",
    hintsEnabled: false,
  });
  await sendMessage(context, reportErrorId, "Please break it MOCK_INVALID_REPORT");
  const pf = await api<{ portfolio: { id: string } }>(context, "post", "/api/portfolios", {
    title: "2025 백엔드 포트폴리오",
    content:
      "# Chat service\nI built a real-time chat backend with Node.js and Redis. Handled 10k concurrent users.\n\n# Billing pipeline\nDesigned an idempotent billing pipeline with Kafka and PostgreSQL.",
  });
  return { chatHintsId, reportChatId, reportErrorId, portfolioId: pf.portfolio.id };
}

async function say(page: Page, text: string): Promise<void> {
  await page.evaluate((t) => window.__leoFakeVoice!.say(t), text);
}

async function startCall(page: Page): Promise<void> {
  await page.getByTestId("start-call").click();
  await page.waitForFunction(() => window.__leoFakeVoice?.listening() === true);
}

// ---------- 상태 목록 ----------
const STATES: State[] = [
  { id: "login", title: "로그인", auth: "anon", run: async (c) => go(c.page, "/login") },
  {
    id: "login-error",
    title: "로그인 오류(잘못된 비밀번호)",
    auth: "anon",
    run: async (c) => {
      await go(c.page, "/login");
      await c.page.getByLabel(auth.email).fill(EMAIL);
      await c.page.getByLabel(auth.password).fill("wrong-password");
      await c.page.getByRole("button", { name: auth.loginButton }).click();
      await c.page.getByRole("form").getByRole("alert").waitFor();
    },
  },
  { id: "signup", title: "회원가입", auth: "anon", run: async (c) => go(c.page, "/signup") },
  // 빈 상태 (픽스처 생성 전)
  { id: "home-empty", title: "홈 · 빈 상태", auth: "auth", run: async (c) => go(c.page, "/") },
  {
    id: "chat-list-empty",
    title: "채팅 목록 · 빈 상태",
    auth: "auth",
    run: async (c) => go(c.page, "/chat"),
  },
  {
    id: "history-empty",
    title: "기록 · 빈 상태",
    auth: "auth",
    run: async (c) => go(c.page, "/history"),
  },
  {
    id: "portfolios-empty",
    title: "포트폴리오 · 빈 상태",
    auth: "auth",
    run: async (c) => go(c.page, "/portfolios"),
  },
  {
    id: "usage-empty",
    title: "사용량 · 빈 상태",
    auth: "auth",
    run: async (c) => go(c.page, "/usage?period=all"),
  },
  {
    id: "call-setup-portfolio-empty",
    title: "통화 설정 · 포트폴리오 면접인데 포트폴리오 없음",
    auth: "auth",
    run: async (c) => {
      await go(c.page, "/call");
      await c.page.locator('input[name="theme"][value="portfolio"]').check();
    },
  },
  { id: "__fixtures__", title: "", auth: "auth", run: async () => undefined },
  // 데이터가 있는 상태
  { id: "home", title: "홈", auth: "auth", run: async (c) => go(c.page, "/") },
  { id: "chat-list", title: "채팅 목록", auth: "auth", run: async (c) => go(c.page, "/chat") },
  {
    id: "chat-empty",
    title: "채팅 · 대화 시작 전",
    auth: "auth",
    run: async (c) => {
      const id = await createConversation(c.context, {
        kind: "chat",
        theme: "free",
        hintsEnabled: false,
      });
      await go(c.page, `/chat/${id}`);
    },
  },
  {
    id: "chat-hints",
    title: "채팅 · 대화 중 + 교정 힌트",
    auth: "auth",
    run: async (c) => go(c.page, `/chat/${c.fixtures.chatHintsId}`),
  },
  {
    id: "chat-sending",
    title: "채팅 · 답변 기다리는 중",
    auth: "auth",
    run: async (c) => {
      const id = await createConversation(c.context, {
        kind: "chat",
        theme: "daily",
        hintsEnabled: true,
      });
      await go(c.page, `/chat/${id}`);
      await c.page.route("**/api/conversations/*/messages", async (route) => {
        await sleep(4000);
        // 지연 중에 unroute 가 먼저 되면 "Route is already handled" 가 나므로 삼킨다.
        await route.continue().catch(() => undefined);
      });
      await c.page.getByLabel(chat.inputLabel).fill("Hi! Can I tell you about my week?");
      await c.page.getByLabel(chat.inputLabel).press("Enter");
      await c.page.getByTestId("streaming").waitFor();
      await c.shot("chat-sending");
      await c.page.unroute("**/api/conversations/*/messages");
      await c.page.getByTestId("msg-assistant").first().waitFor({ timeout: 20_000 });
    },
  },
  {
    id: "chat-error",
    title: "채팅 · 응답 오류 + 다시 시도",
    auth: "auth",
    run: async (c) => {
      const id = await createConversation(c.context, {
        kind: "chat",
        theme: "free",
        hintsEnabled: false,
      });
      await go(c.page, `/chat/${id}`);
      await c.page.getByLabel(chat.inputLabel).fill("Hello MOCK_ERROR");
      await c.page.getByLabel(chat.inputLabel).press("Enter");
      await c.page.locator("main").getByRole("alert").waitFor();
    },
  },
  {
    id: "chat-ended",
    title: "채팅 · 종료된 대화",
    auth: "auth",
    run: async (c) => go(c.page, `/chat/${c.fixtures.reportChatId}`),
  },
  { id: "call-setup", title: "통화 설정", auth: "auth", run: async (c) => go(c.page, "/call") },
  {
    id: "call-setup-mic-ok",
    title: "통화 설정 · 마이크 확인 후",
    auth: "auth",
    run: async (c) => {
      await go(c.page, "/call");
      await c.page.getByRole("button", { name: callSetup.micCheck }).click();
      await c.page.getByTestId("mic-status").filter({ hasText: callSetup.micGranted }).waitFor();
    },
  },
  {
    id: "call-idle",
    title: "통화 · 시작 전",
    auth: "auth",
    run: async (c) => {
      const id = await createConversation(c.context, {
        kind: "call",
        theme: "interview",
        durationMin: 0,
      });
      await go(c.page, `/call/${id}`);
    },
  },
  {
    id: "call-live",
    title: "통화 중(듣는 중, 연장 버튼) → 종료 중 → 통화 리포트",
    auth: "auth",
    run: async (c) => {
      const id = await createConversation(c.context, {
        kind: "call",
        theme: "interview",
        durationMin: 0,
      });
      await go(c.page, `/call/${id}`);
      await startCall(c.page);
      await say(c.page, "Hi, I am backend developer for five years.");
      await c.page.getByTestId("msg-assistant").first().waitFor({ timeout: 20_000 });
      await c.page.waitForFunction(() => window.__leoFakeVoice?.listening() === true);
      await c.shot("call-live");
      await c.page.getByRole("button", { name: callLive.mute, exact: true }).click();
      await c.shot("call-muted");
      await c.page.getByRole("button", { name: callLive.unmute }).click();
      await c.page.route("**/api/conversations/*/report", async (route) => {
        await sleep(4000);
        // 지연 중에 unroute 가 먼저 되면 "Route is already handled" 가 나므로 삼킨다.
        await route.continue().catch(() => undefined);
      });
      await c.page.getByTestId("hangup").click();
      await c.page.getByText(callLive.status.ending).waitFor();
      await c.shot("call-ending");
      await c.page.unroute("**/api/conversations/*/report");
      await c.page.waitForURL(/\/report$/, { timeout: 40_000 });
      await hydrated(c.page);
      await c.shot("report-call-interview");
    },
  },
  {
    id: "call-text-mode",
    title: "통화 · 음성 인식 미지원(텍스트 입력)",
    auth: "auth",
    run: async (c) => {
      const id = await createConversation(c.context, {
        kind: "call",
        theme: "daily",
        durationMin: 10,
      });
      await c.page.addInitScript(() => {
        window.__LEO_FAKE_VOICE_SUPPORT = { stt: false, tts: true };
      });
      await go(c.page, `/call/${id}`);
      await c.page.getByTestId("start-call").click();
      await c.page.getByText(callLive.textModeNotice).waitFor();
    },
  },
  {
    id: "report-chat-interview",
    title: "리포트(채팅·면접)",
    auth: "auth",
    run: async (c) => go(c.page, `/history/${c.fixtures.reportChatId}/report`),
  },
  {
    id: "report-error",
    title: "리포트 · 생성 실패(스키마) + 다시 시도",
    auth: "auth",
    run: async (c) => {
      await go(c.page, `/history/${c.fixtures.reportErrorId}/report`);
      await c.shot("report-missing");
      await c.page.getByRole("button", { name: report.make }).click();
      await c.page
        .getByTestId("report-retry")
        .getByRole("button", { name: common.retry })
        .waitFor({ timeout: 30_000 });
      await c.shot("report-error");
    },
  },
  {
    id: "chat-refusal",
    title: "채팅 · 상대가 답하지 않기로 함(refusal)",
    auth: "auth",
    run: async (c) => {
      const id = await createConversation(c.context, {
        kind: "chat",
        theme: "free",
        hintsEnabled: false,
      });
      await go(c.page, `/chat/${id}`);
      await c.page.getByLabel(chat.inputLabel).fill("Tell me MOCK_REFUSAL");
      await c.page.getByLabel(chat.inputLabel).press("Enter");
      // 거절은 오류가 아니라 안내(info, role=status)다(7단계 리뷰 A 27).
      await c.page
        .locator("main")
        .getByRole("status")
        .filter({ hasText: errors.conversation.refusal })
        .waitFor();
    },
  },
  {
    id: "chat-network-error",
    title: "채팅 · 네트워크 끊김",
    auth: "auth",
    run: async (c) => {
      const id = await createConversation(c.context, {
        kind: "chat",
        theme: "free",
        hintsEnabled: false,
      });
      await go(c.page, `/chat/${id}`);
      await c.page.route("**/api/conversations/*/messages", (route) =>
        route.abort("connectionfailed"),
      );
      await c.page.getByLabel(chat.inputLabel).fill("Hello?");
      await c.page.getByLabel(chat.inputLabel).press("Enter");
      await c.page.locator("main").getByRole("alert").waitFor();
      await c.page.unroute("**/api/conversations/*/messages");
    },
  },
  {
    id: "chat-remake-dialog",
    title: "채팅 · 리포트 다시 만들기 확인 대화",
    auth: "auth",
    run: async (c) => {
      await go(c.page, `/chat/${c.fixtures.reportChatId}`);
      await c.page.getByRole("button", { name: chat.remakeReport }).click();
      await c.page.getByRole("dialog").waitFor();
    },
  },
  {
    id: "portfolios-delete-dialog",
    title: "포트폴리오 · 삭제 확인 대화",
    auth: "auth",
    run: async (c) => {
      await go(c.page, "/portfolios");
      await c.page.getByRole("button", { name: /삭제$/ }).first().click();
      await c.page.getByRole("dialog").waitFor();
    },
  },
  {
    id: "settings-saved",
    title: "설정 · 저장 토스트",
    auth: "auth",
    run: async (c) => {
      await go(c.page, "/settings");
      await c.page.getByRole("button", { name: settings.save }).click();
      await c.page.getByText(settings.saved).waitFor();
    },
  },
  {
    id: "transcript",
    title: "트랜스크립트",
    auth: "auth",
    run: async (c) => go(c.page, `/history/${c.fixtures.reportChatId}`),
  },
  { id: "history", title: "기록 목록", auth: "auth", run: async (c) => go(c.page, "/history") },
  {
    id: "portfolios",
    title: "포트폴리오 목록",
    auth: "auth",
    run: async (c) => go(c.page, "/portfolios"),
  },
  {
    id: "portfolios-pdf-mode",
    title: "포트폴리오 · PDF 업로드 모드",
    auth: "auth",
    run: async (c) => {
      await go(c.page, "/portfolios");
      await c.page.getByLabel(portfolio.modePdf).check();
    },
  },
  { id: "usage", title: "사용량", auth: "auth", run: async (c) => go(c.page, "/usage?period=all") },
  { id: "settings", title: "설정", auth: "auth", run: async (c) => go(c.page, "/settings") },
];

// API 키 없음 서버(CLAUDE_MOCK=0, 키 없음)에서 찍는 상태
const NOKEY_STATES: State[] = [
  {
    id: "home-nokey",
    title: "홈 · API 키 없음 배너",
    auth: "auth",
    run: async (c) => go(c.page, "/"),
  },
  {
    id: "chat-nokey-error",
    title: "채팅 · API 키 없음 오류",
    auth: "auth",
    run: async (c) => {
      const id = await createConversation(c.context, {
        kind: "chat",
        theme: "free",
        hintsEnabled: false,
      });
      await go(c.page, `/chat/${id}`);
      await c.page.getByLabel(chat.inputLabel).fill("Hello!");
      await c.page.getByLabel(chat.inputLabel).press("Enter");
      await c.page.locator("main").getByRole("alert").waitFor({ timeout: 20_000 });
    },
  },
];

// 대화 횟수 한도(LEO_MAX_TURNS=1) 서버에서 찍는 상태
const LIMIT_STATES: State[] = [
  {
    id: "chat-turn-cap",
    title: "채팅 · 대화 횟수 한도",
    auth: "auth",
    run: async (c) => {
      const id = await createConversation(c.context, {
        kind: "chat",
        theme: "free",
        hintsEnabled: false,
      });
      await sendMessage(c.context, id, "Hello!");
      await go(c.page, `/chat/${id}`);
      await c.page.getByLabel(chat.inputLabel).fill("One more?");
      await c.page.getByLabel(chat.inputLabel).press("Enter");
      await c.page.locator("main").getByRole("alert").waitFor();
    },
  },
  {
    id: "call-turn-cap",
    title: "통화 · 대화 횟수 한도로 종료",
    auth: "auth",
    run: async (c) => {
      const id = await createConversation(c.context, {
        kind: "call",
        theme: "daily",
        durationMin: 10,
      });
      await sendMessage(c.context, id, "Hello!");
      await go(c.page, `/call/${id}`);
      await startCall(c.page);
      await c.page.route("**/api/conversations/*/report", async (route) => {
        await sleep(6000);
        // 지연 중에 unroute 가 먼저 되면 "Route is already handled" 가 나므로 삼킨다.
        await route.continue().catch(() => undefined);
      });
      await say(c.page, "One more thing.");
      await c.page.getByText(callLive.turnCapEnd).waitFor({ timeout: 15_000 });
      await c.shot("call-turn-cap");
      await c.page.unroute("**/api/conversations/*/report");
      await c.page.waitForURL(/\/report$/, { timeout: 40_000 });
    },
  },
];

// ---------- 실행 ----------
async function runStates(
  browser: Browser,
  states: State[],
  fixturesRef: { current: Fixtures | null },
): Promise<void> {
  const contexts = new Map<string, BrowserContext>();
  for (const v of VARIANTS) contexts.set(v.name, await newContext(browser, v));
  let loggedIn = false;

  for (const state of states) {
    if (state.id === "__fixtures__") {
      const first = contexts.get(VARIANTS[0]!.name)!;
      if (!loggedIn) {
        for (const ctx of contexts.values()) await login(ctx);
        loggedIn = true;
      }
      fixturesRef.current = await makeFixtures(first);
      continue;
    }
    if (!wanted(state.id)) continue;
    if (state.auth === "auth" && !loggedIn) {
      for (const ctx of contexts.values()) await login(ctx);
      loggedIn = true;
    }
    for (const v of VARIANTS) {
      const context = contexts.get(v.name)!;
      const page = await context.newPage();
      let shots = 0;
      const shot = async (name: string) => {
        shots += 1;
        const file = `${name}--${v.name}.png`;
        // Next 개발 도구 표시(좌하단 N 버튼)는 제품 화면이 아니므로 가린다.
        await page
          .addStyleTag({ content: "nextjs-portal { display: none !important; }" })
          .catch(() => undefined);
        // 전체 페이지 캡처가 스크롤 위치에 따라 sticky 요소를 중간에 그리지 않도록 맨 위로 올린다.
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          path: path.join(OUT, file),
          fullPage: true,
          animations: "disabled",
        });
        const ov = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));
        overflow.push({ shot: name, variant: v.name, ...ov });
        if (v.name === VARIANTS[0]!.name) index.push({ name, title: state.title });
        if (runAxe) {
          const results = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
            .analyze();
          axeRecords.push({ shot: name, variant: v.name, violations: results.violations });
        }
        process.stdout.write(`  ${file}\n`);
      };
      const fx = fixturesRef.current ?? {
        chatHintsId: "",
        reportChatId: "",
        reportErrorId: "",
        portfolioId: "",
      };
      try {
        await state.run({ page, context, variant: v, fixtures: fx, shot });
        if (shots === 0) await shot(state.id);
      } catch (e) {
        process.stderr.write(`[${state.id} / ${v.name}] 실패: ${(e as Error).message}\n`);
        await page
          .screenshot({
            path: path.join(OUT, `${state.id}--${v.name}--FAILED.png`),
            fullPage: true,
          })
          .catch(() => undefined);
      } finally {
        await page.close();
      }
    }
  }
  for (const ctx of contexts.values()) await ctx.close();
}

function writeAxeReport(): void {
  writeFileSync(path.join(OUT, "axe.json"), JSON.stringify(axeRecords, null, 2));
  const byRule = new Map<
    string,
    { impact: string; help: string; helpUrl: string; count: number; shots: Set<string> }
  >();
  const lines: string[] = [];
  lines.push(
    `# axe-core 결과 (${label})`,
    "",
    `실행: \`npx tsx scripts/screenshots.ts ${direction ? `--direction ${direction}` : `--phase ${phase}`} --axe\` · 태그 wcag2a/2aa/21a/21aa/22aa/best-practice · 스크린샷 ${axeRecords.length}장 검사`,
    "",
  );
  for (const rec of axeRecords) {
    for (const v of rec.violations) {
      const key = v.id;
      const entry = byRule.get(key) ?? {
        impact: v.impact ?? "",
        help: v.help,
        helpUrl: v.helpUrl,
        count: 0,
        shots: new Set<string>(),
      };
      entry.count += v.nodes.length;
      entry.shots.add(`${rec.shot}--${rec.variant}`);
      byRule.set(key, entry);
    }
  }
  lines.push(
    "## 규칙별 요약",
    "",
    "| 규칙 | 영향 | 노드 수 | 화면 수 | 설명 |",
    "|---|---|---:|---:|---|",
  );
  for (const [id, e] of [...byRule.entries()].sort((a, b) => b[1].count - a[1].count)) {
    lines.push(
      `| \`${id}\` | ${e.impact} | ${e.count} | ${e.shots.size} | [${e.help}](${e.helpUrl}) |`,
    );
  }
  if (byRule.size === 0) lines.push("| (위반 없음) | | | | |");
  lines.push("", "## 화면별 상세", "");
  for (const rec of axeRecords) {
    if (rec.violations.length === 0) continue;
    lines.push(`### ${rec.shot} (${rec.variant})`, "");
    for (const v of rec.violations) {
      for (const n of v.nodes) {
        const data = n.any[0]?.data as
          | {
              contrastRatio?: number;
              fgColor?: string;
              bgColor?: string;
              expectedContrastRatio?: string;
            }
          | undefined;
        const ratio =
          data?.contrastRatio !== undefined
            ? ` · 대비 ${data.contrastRatio}:1 (요구 ${data.expectedContrastRatio ?? ""}, fg ${data.fgColor ?? ""} / bg ${data.bgColor ?? ""})`
            : "";
        lines.push(
          `- \`${v.id}\` [${v.impact}] ${n.target.join(" ")}${ratio} — ${n.html.replace(/\s+/g, " ").slice(0, 120)}`,
        );
      }
    }
    lines.push("");
  }
  writeFileSync(path.join(OUT, "axe.md"), lines.join("\n"));
}

async function main(): Promise<void> {
  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
  prepareDb();
  const fixturesRef: { current: Fixtures | null } = { current: null };
  const browser = await chromium.launch();
  let server = await startServer({});
  process.stdout.write(`서버 ${BASE} (모의 모드)\n`);
  try {
    await runStates(browser, STATES, fixturesRef);
  } finally {
    stopServer(server);
  }
  if (wanted("nokey")) {
    await sleep(1500);
    server = await startServer({ CLAUDE_MOCK: "0", LEO_ANTHROPIC_API_KEY: "" });
    process.stdout.write(`서버 ${BASE} (API 키 없음)\n`);
    try {
      await runStates(browser, NOKEY_STATES, fixturesRef);
    } finally {
      stopServer(server);
    }
  }
  if (wanted("turn-cap")) {
    await sleep(1500);
    server = await startServer({ LEO_MAX_TURNS: "1" });
    process.stdout.write(`서버 ${BASE} (대화 횟수 한도 1)\n`);
    try {
      await runStates(browser, LIMIT_STATES, fixturesRef);
    } finally {
      stopServer(server);
    }
  }
  await browser.close();

  const md = [
    "# 스크린샷 목록 (" + label + ")",
    "",
    "각 상태는 `--1280-light`, `--1280-dark`, `--390-light`, `--390-dark` 네 장이 있다.",
    "",
    "캡처 방식: `fullPage` 로 문서 전체를 찍으므로 고정 요소(채팅 입력창, 통화 컨트롤, 다이얼로그 스크림)가 긴 화면에서는 문서 중간 위치에 찍힌다. 실제 브라우저에서는 뷰포트 하단에 고정되고 스크림은 화면 전체를 덮는다(7단계 리뷰 A 32).",
    "",
    "| 파일 접두사 | 상태 |",
    "|---|---|",
  ];
  for (const i of index) md.push(`| \`${i.name}\` | ${i.title} |`);
  writeFileSync(path.join(OUT, "index.md"), md.join("\n") + "\n");
  if (runAxe) writeAxeReport();
  {
    const bad = overflow.filter((o) => o.scrollWidth > o.innerWidth + 1);
    const lines = [
      `# 가로 스크롤 검사 (${label}${widthsOpt ? `, 폭 ${widthsOpt}` : ""})`,
      "",
      `검사 ${overflow.length}장 · 가로 스크롤 발생 ${bad.length}장`,
      "",
    ];
    if (bad.length) {
      lines.push("| 상태 | 변형 | scrollWidth | innerWidth |", "|---|---|---:|---:|");
      for (const o of bad)
        lines.push(`| ${o.shot} | ${o.variant} | ${o.scrollWidth} | ${o.innerWidth} |`);
    }
    const suffix = widthsOpt ? "-" + widthsOpt.replace(/,/g, "-") : "";
    writeFileSync(path.join(OUT, `overflow${suffix}.md`), lines.join("\n") + "\n");
  }
  for (const f of [DB_FILE, `${DB_FILE}-journal`]) rmSync(path.join(ROOT, f), { force: true });
  process.stdout.write(`완료: ${index.length}개 상태 × ${VARIANTS.length} → ${OUT}\n`);
}

main().catch((e) => {
  process.stderr.write(`${(e as Error).stack ?? e}\n`);
  process.exit(1);
});
