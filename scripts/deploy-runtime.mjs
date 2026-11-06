import { spawn, execFile } from "node:child_process";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { mkdir, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { StringDecoder } from "node:string_decoder";
import { setTimeout as sleep } from "node:timers/promises";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export async function findFreePort(start = 3200, end = 3299) {
  for (let port = start; port <= end; port++) {
    const available = await new Promise((done, reject) => {
      const probe = createServer();
      probe.once("error", (error) => {
        if (error.code === "EADDRINUSE" || error.code === "EACCES") done(false);
        else reject(error);
      });
      probe.listen({ host: "127.0.0.1", port, exclusive: true }, () => probe.close(() => done(true)));
    });
    if (available) return port;
  }
  throw new Error(`${start}~${end} 포트가 모두 사용 중입니다. 기존 서버는 그대로 유지합니다.`);
}

export function tunnelUrl(text) {
  return text.match(/https:\/\/[a-z0-9]+(?:-[a-z0-9]+)*\.trycloudflare\.com(?=[\s/]|$)/i)?.[0] ?? null;
}

export function deploymentEnv(base, release) {
  return {
    ...base,
    NODE_ENV: "production",
    NEXT_DIST_DIR: release.distDir,
    LEO_TSCONFIG_PATH: release.tsconfigPath,
    APP_URL: "https://tunnel",
    LEO_ALLOW_SIGNUP: "0",
    CLAUDE_MOCK: "0",
  };
}

export async function prepareRelease(root) {
  const id = `${new Date().toISOString().replace(/[-:.TZ]/g, "")}-${randomUUID().slice(0, 8)}`;
  const distDir = `.next-release-${id}`;
  const runDir = join(root, ".leo-runtime", id);
  const tsconfigPath = `.leo-runtime/${id}/tsconfig.json`;
  await mkdir(runDir, { recursive: true });
  const require = createRequire(import.meta.url);
  const ts = require("typescript");
  const base = ts.readConfigFile(join(root, "tsconfig.json"), ts.sys.readFile);
  if (base.error) throw new Error("tsconfig.json을 읽을 수 없습니다.");
  await writeFile(join(root, tsconfigPath), JSON.stringify({
    extends: "../../tsconfig.json",
    compilerOptions: { tsBuildInfoFile: "./build.tsbuildinfo" },
    include: [
      ...(base.config.include ?? ["**/*.ts", "**/*.tsx"]).map((pattern) => resolve(root, pattern).replaceAll("\\", "/")),
      `${root.replaceAll("\\", "/")}/${distDir}/types/**/*.ts`,
    ],
  }, null, 2) + "\n");
  return { id, distDir, runDir, tsconfigPath };
}

export function launch(executable, args, { root, env, logFile, echo = false }) {
  const log = createWriteStream(logFile, { flags: "a" });
  const child = spawn(executable, args, { cwd: root, env, windowsHide: true, shell: false, stdio: ["ignore", "pipe", "pipe"] });
  const running = { pid: child.pid, text: "", ended: false, result: null, done: null, stop: null };
  for (const stream of [child.stdout, child.stderr]) {
    const decoder = new StringDecoder("utf8");
    stream.on("data", (chunk) => {
      const text = decoder.write(chunk);
      running.text = (running.text + text).slice(-64_000);
      log.write(text);
      if (echo) process.stdout.write(text);
    });
  }
  running.done = new Promise((done) => {
    const finish = (result) => {
      if (running.ended) return;
      running.ended = true;
      running.result = result;
      log.end();
      done(result);
    };
    child.once("error", (error) => finish({ code: 1, error: error.message }));
    child.once("close", (code) => finish({ code: code ?? 1 }));
  });
  log.on("error", () => child.kill());
  running.stop = async () => {
    if (running.ended) return;
    if (!child.pid || child.exitCode !== null || child.signalCode !== null) { await running.done; return; }
    // 이번 실행에서 직접 시작한 프로세스 트리만 정리한다. 이름·포트로 기존 서버를 종료하지 않는다.
    try { await execFileAsync("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true }); }
    catch { if (!running.ended) child.kill(); }
    let timer;
    try {
      await Promise.race([
        running.done,
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error(`프로세스 ${child.pid}의 종료를 확인하지 못했습니다.`)), 5000);
        }),
      ]);
    } finally { clearTimeout(timer); }
  };
  return running;
}

export async function waitForOutput(running, match, signal, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    signal.throwIfAborted();
    if (running.ended) throw new Error(`프로세스가 종료됐습니다 (code ${running.result?.code}). 로그를 확인해 주세요.`);
    const value = match(running.text);
    if (value) return value;
    await sleep(200, undefined, { signal });
  }
  throw new Error("시작 대기 시간을 초과했습니다. 로그를 확인해 주세요.");
}

export async function waitForHttp(url, signal, running, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    signal.throwIfAborted();
    if (running.ended) throw new Error("접속을 확인하던 중 프로세스가 종료됐습니다.");
    try {
      const response = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(4000)]) });
      await response.body?.cancel();
      if (response.status === 200) return;
    } catch { signal.throwIfAborted(); }
    await sleep(500, undefined, { signal });
  }
  throw new Error(`접속 확인에 실패했습니다: ${url}`);
}

export async function abortable(promise, signal) {
  signal.throwIfAborted();
  let onAbort;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      onAbort = () => reject(signal.reason);
      signal.addEventListener("abort", onAbort, { once: true });
    })]);
  } finally {
    signal.removeEventListener("abort", onAbort);
  }
}
