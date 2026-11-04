/*
 * 프로덕션 빌드(next start)로 첫 로드 성능을 잰다: 폰트·CSS·JS 전송량, CLS(layout-shift 누적), 로드 시간.
 *   npm run build && npx tsx scripts/perf.ts [--port 3160]
 * 결과: docs/design/PERF.md 에 표로 쓴다. 실제 Claude 호출 없음(CLAUDE_MOCK=1).
 */
import { execSync, spawn, type ChildProcess } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const PORT = Number(process.argv[process.argv.indexOf("--port") + 1] || 3160);
const BASE = `http://localhost:${PORT}`;
const ROOT = process.cwd();
const DB = "perf.db";

function env(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    DATABASE_URL: `file:./${DB}`,
    CLAUDE_MOCK: "1",
    AUTH_SECRET: process.env.AUTH_SECRET || "perf-secret-perf-secret-perf-secret-000",
    SEED_USER_PASSWORD: "leo-pass-1234",
    PORT: String(PORT),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function start(): Promise<ChildProcess> {
  for (const f of [DB, `${DB}-journal`]) rmSync(path.join(ROOT, f), { force: true });
  execSync("npx prisma migrate deploy", { cwd: ROOT, env: env(), stdio: "pipe" });
  execSync("npx tsx prisma/seed.ts", { cwd: ROOT, env: env(), stdio: "pipe" });
  const child = spawn("npx", ["next", "start", "--port", String(PORT)], {
    cwd: ROOT,
    env: env(),
    shell: true,
    detached: true,
    stdio: ["ignore", "ignore", "pipe"],
  });
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${BASE}/login`, { redirect: "manual" });
      if (r.status === 200) return child;
    } catch {
      // not yet
    }
    await sleep(300);
  }
  throw new Error("next start 가 60초 안에 뜨지 않았습니다.");
}

type Metric = {
  url: string;
  width: number;
  cls: number;
  domContentLoaded: number;
  load: number;
  font: number;
  css: number;
  js: number;
  html: number;
  fontFiles: number;
};

async function measure(page: Page, url: string, width: number): Promise<Metric> {
  const bytes = { font: 0, css: 0, js: 0, html: 0, fontFiles: 0 };
  page.on("response", async (res) => {
    const type = res.request().resourceType();
    let size = 0;
    try {
      const len = res.headers()["content-length"];
      size = len ? Number(len) : (await res.body()).length;
    } catch {
      size = 0;
    }
    if (type === "font") {
      bytes.font += size;
      bytes.fontFiles += 1;
    } else if (type === "stylesheet") bytes.css += size;
    else if (type === "script") bytes.js += size;
    else if (type === "document") bytes.html += size;
  });
  await page.setViewportSize({ width, height: width < 700 ? 844 : 800 });
  await page.addInitScript(() => {
    const w = window as unknown as { __cls: number };
    w.__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & {
        hadRecentInput?: boolean;
        value?: number;
      })[]) {
        if (!entry.hadRecentInput) w.__cls += entry.value ?? 0;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(`${BASE}${url}`, { waitUntil: "load" });
  await page.waitForLoadState("networkidle");
  await sleep(1500); // 폰트 스왑·레이아웃 안정화 대기
  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    return { dcl: nav.domContentLoadedEventEnd, load: nav.loadEventEnd };
  });
  const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
  page.removeAllListeners("response");
  return {
    url,
    width,
    cls: Math.round(cls * 10000) / 10000,
    domContentLoaded: Math.round(timing.dcl),
    load: Math.round(timing.load),
    ...bytes,
  };
}

async function main(): Promise<void> {
  const server = await start();
  const browser = await chromium.launch();
  const rows: Metric[] = [];
  try {
    const context = await browser.newContext({ locale: "ko-KR" });
    const page = await context.newPage();
    rows.push(await measure(page, "/login", 1280));
    rows.push(await measure(page, "/login", 390));
    await context.request.post(`${BASE}/api/auth/login`, {
      data: { email: "dev1@leo.local", password: "leo-pass-1234" },
    });
    for (const url of ["/", "/chat", "/call", "/history", "/settings"]) {
      rows.push(await measure(page, url, 1280));
      rows.push(await measure(page, url, 390));
    }
    await context.close();
  } finally {
    await browser.close();
    if (server.pid !== undefined) {
      try {
        process.kill(-server.pid, "SIGTERM");
      } catch {
        server.kill("SIGTERM");
      }
    }
    for (const f of [DB, `${DB}-journal`]) rmSync(path.join(ROOT, f), { force: true });
  }
  const kb = (n: number) => `${(n / 1024).toFixed(1)}KB`;
  const lines = [
    "# 첫 로드 성능 (6단계)",
    "",
    `측정: \`npm run build && npx tsx scripts/perf.ts\` — 프로덕션 서버(next start, 모의 모드), Chromium headless, 캐시 없는 새 컨텍스트, 각 URL 을 1280·390 폭으로 1회. 바이트는 전송 크기(content-length 또는 본문 길이). CLS 는 PerformanceObserver layout-shift 누적(입력 없는 것만), 로드 후 1.5초까지. 날짜: ${new Date().toISOString().slice(0, 10)}`,
    "",
    "| URL | 폭 | CLS | DCL(ms) | load(ms) | HTML | CSS | JS | 폰트(파일 수) |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
    ...rows.map(
      (r) =>
        `| ${r.url} | ${r.width} | ${r.cls} | ${r.domContentLoaded} | ${r.load} | ${kb(r.html)} | ${kb(r.css)} | ${kb(r.js)} | ${kb(r.font)} (${r.fontFiles}) |`,
    ),
    "",
    "기준: CLS 0.1 미만이 '좋음'(web.dev Core Web Vitals, 확인 못 함 — 값은 일반적으로 알려진 임계값이며 이번 조사에서 원문을 읽지 않았다). 폰트는 다이나믹 서브셋이라 화면에 쓰인 글자 범위만 받는다.",
  ];
  writeFileSync(path.join(ROOT, "docs", "design", "PERF.md"), lines.join("\n") + "\n");
  process.stdout.write(lines.join("\n") + "\n");
}

main().catch((e) => {
  process.stderr.write(`${(e as Error).stack ?? e}\n`);
  process.exit(1);
});
