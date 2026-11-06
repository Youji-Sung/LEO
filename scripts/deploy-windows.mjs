import { spawn, execFile } from "node:child_process";
import { openSync, closeSync } from "node:fs";
import { access, mkdir, open, readFile, writeFile, readdir, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { setTimeout as sleep } from "node:timers/promises";
import { projectRoot, prepareRelease, deploymentEnv, findFreePort, launch, waitForOutput, waitForHttp, tunnelUrl } from "./deploy-runtime.mjs";

const exec = promisify(execFile);
const flags = ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File"];

export function originPort(command) {
  const match = command?.match(/(?:^|\s)--url(?:=|\s+)"?http:\/\/(?:127\.0\.0\.1|localhost):(\d+)(?=[/"\s]|$)/i);
  const port = Number(match?.[1]);
  return port > 0 && port < 65536 ? port : null;
}

export function sameProcess(a, b) { return Boolean(a && b && a.pid === b.pid && a.startedAt === b.startedAt); }

async function request(url) {
  return fetch(url, { signal: AbortSignal.timeout(8000), redirect: "error", headers: { "Cache-Control": "no-cache" } });
}

export function realServices(root = projectRoot, requestedUrl) {
  const runtime = join(root, ".leo-runtime");
  const processScript = join(root, "scripts/deploy-process.ps1");
  let release;
  const snapshot = async () => JSON.parse((await exec("powershell.exe", [...flags, processScript, "-Action", "snapshot"], { windowsHide: true, maxBuffer: 4_000_000 })).stdout);
  const stop = async (process, port = 0) => {
    await exec("powershell.exe", [...flags, processScript, "-Action", "stop", "-TargetPid", String(process.pid), "-ExpectedStartedAt", process.startedAt, "-ExpectedPort", String(port)], { windowsHide: true });
  };
  const urlFor = async (process, inventory) => {
    for (const listener of inventory.listeners.filter((item) => item.pid === process.pid)) {
      try {
        const response = await request(`http://127.0.0.1:${listener.port}/quicktunnel`);
        const data = await response.json();
        const url = `https://${data.hostname}`;
        if (tunnelUrl(url) === url) return { url, metricsPort: listener.port };
      } catch { /* Only the local metrics listener exposes the hostname. */ }
    }
    return null;
  };
  const fingerprint = async (desc) => {
    const directory = resolve(root, desc.distDir);
    if (directory !== resolve(root, ".next") && !/^\.next-release-[\w-]+$/.test(desc.distDir)) throw new Error("잘못된 빌드 폴더입니다.");
    const buildId = (await readFile(join(directory, "BUILD_ID"), "utf8")).trim();
    if (!/^[\w-]+$/.test(buildId)) throw new Error("잘못된 빌드 ID입니다.");
    return { ...desc, buildId, asset: `/_next/static/${buildId}/_buildManifest.js`, manifest: await readFile(join(directory, "static", buildId, "_buildManifest.js"), "utf8") };
  };
  const matches = async (base, desc) => {
    try {
      const response = await request(`${base}${desc.asset}`);
      return response.status === 200 && await response.text() === desc.manifest;
    } catch { return false; }
  };
  const findApp = async (target) => {
    const inventory = await snapshot();
    const owners = [...new Set(inventory.listeners.filter((item) => item.port === target.port).map((item) => item.pid))];
    if (!owners.length) return null;
    const process = inventory.processes.find((item) => item.pid === owners[0]);
    if (owners.length !== 1 || process?.name !== "node.exe" || !/next(?:[\\/]dist[\\/]bin[\\/]next)?["\s]+start\b/i.test(process.command)) {
      throw new Error(`포트 ${target.port}의 앱을 확인할 수 없어 종료하지 않습니다.`);
    }
    const parent = inventory.processes.find((item) => item.pid === process.parentPid);
    if (parent?.command?.includes("deploy-tunnel.mjs") && parent.startedAt <= process.startedAt) throw new Error("이전 배포 창이 앱과 터널을 함께 관리하고 있습니다. 터널 종료를 피하기 위해 자동 교체를 중단합니다.");
    const folders = [".next", ...(await readdir(root)).filter((name) => /^\.next-release-[\w-]+$/.test(name))];
    for (const distDir of folders) {
      try {
        let tsconfigPath = "tsconfig.json";
        if (distDir !== ".next") {
          const candidate = `.leo-runtime/${distDir.slice(".next-release-".length)}/tsconfig.json`;
          try { await access(join(root, candidate)); tsconfigPath = candidate; } catch { /* Legacy release. */ }
        }
        const desc = await fingerprint({ distDir, tsconfigPath });
        if (await matches(`http://127.0.0.1:${target.port}`, desc)) return { ...desc, process };
      } catch { /* Incomplete or different release. */ }
    }
    throw new Error("실행 중인 앱의 빌드 파일을 확인할 수 없어 교체를 중단합니다.");
  };
  const checkTarget = async (target) => {
    const inventory = await snapshot();
    const process = inventory.processes.find((item) => sameProcess(item, target.process));
    if (!process || originPort(process.command) !== target.port) throw new Error("기존 터널이 변경되거나 종료됐습니다. 새 주소는 만들지 않습니다.");
    const current = await urlFor(process, inventory);
    if (current?.url !== target.url) throw new Error("터널 주소가 달라져 배포를 중단합니다.");
  };
  const health = async (base, desc, signal) => {
    const deadline = Date.now() + 45_000;
    while (Date.now() < deadline) {
      signal.throwIfAborted();
      if (await matches(base, desc)) {
        try {
          const response = await request(`${base}/login`);
          await response.body?.cancel();
          if (response.status === 200) return;
        } catch { /* Retry temporary startup/network errors. */ }
      }
      await sleep(300, undefined, { signal });
    }
    throw new Error(`새 빌드의 접속을 확인하지 못했습니다: ${base}`);
  };
  const persistent = async (desc, port, label) => {
    const logFile = join(release.runDir, `${label}.log`);
    const fd = openSync(logFile, "a");
    let child;
    try {
      child = spawn(process.execPath, [join(root, "node_modules/next/dist/bin/next"), "start", "-H", "127.0.0.1", "-p", String(port)], {
        cwd: root, env: deploymentEnv(process.env, desc), detached: true, windowsHide: true, stdio: ["ignore", fd, fd],
      });
      await new Promise((done, reject) => { child.once("spawn", done); child.once("error", reject); });
    } finally { closeSync(fd); }
    child.unref();
    try {
      const processInfo = (await snapshot()).processes.find((item) => item.pid === child.pid);
      if (!processInfo) throw new Error(`앱 시작에 실패했습니다. ${logFile}`);
      return processInfo;
    } catch (error) {
      if (child.exitCode === null && !child.killed) child.kill();
      throw error;
    }
  };
  return {
    say: (text) => console.log(text),
    check: async () => {
      if (process.platform !== "win32" || Number(process.versions.node.split(".")[0]) < 22) throw new Error("Windows와 Node.js 22 이상이 필요합니다.");
      for (const path of [".env", "node_modules/next/dist/bin/next", "src/generated/prisma/client.ts"]) await access(join(root, path));
    },
    lock: async () => {
      await mkdir(runtime, { recursive: true });
      const path = join(runtime, "deploy.lock");
      const inventory = await snapshot();
      const processInfo = inventory.processes.find((item) => item.pid === process.pid);
      const token = randomUUID();
      let file;
      try { file = await open(path, "wx"); }
      catch (error) {
        if (error.code === "EEXIST") throw new Error("다른 배포가 진행 중이거나 중단된 배포 잠금이 남아 있습니다. .leo-runtime/deploy.lock의 PID를 확인해 주세요.");
        throw error;
      }
      try { await file.writeFile(JSON.stringify({ token, process: processInfo })); } finally { await file.close(); }
      return async () => {
        const current = JSON.parse(await readFile(path, "utf8"));
        if (current.token === token) await unlink(path);
      };
    },
    target: async () => {
      let pinned = requestedUrl;
      if (!pinned) {
        try { pinned = JSON.parse(await readFile(join(runtime, "tunnel-target.json"), "utf8")).url; }
        catch (error) { if (error.code !== "ENOENT") throw error; }
      }
      const inventory = await snapshot();
      const available = [];
      for (const process of inventory.processes.filter((item) => item.name === "cloudflared.exe" && originPort(item.command))) {
        const address = await urlFor(process, inventory);
        if (address) available.push({ ...address, process, port: originPort(process.command) });
      }
      const choices = available.filter((item) => !pinned || item.url === pinned);
      if (choices.length !== 1) throw new Error(pinned ? `기존 터널 ${pinned}을 찾지 못했습니다. 새 주소는 만들지 않습니다.` : `기존 터널 하나를 지정해 주세요: deploy.bat --url <기존 주소>\n${available.map((item) => item.url).join("\n")}`);
      return choices[0];
    },
    previous: findApp,
    prepare: async () => { release = await prepareRelease(root); return release; },
    build: () => launch(process.execPath, [join(root, "node_modules/next/dist/bin/next"), "build"], { root, env: deploymentEnv(process.env, release), logFile: join(release.runDir, "build.log"), echo: true }),
    stage: async () => {
      const inventory = await snapshot();
      const reserved = inventory.processes.map((item) => originPort(item.command));
      let port = 3300;
      while (port <= 3399) { port = await findFreePort(port, 3399); if (!reserved.includes(port)) break; port++; }
      if (port > 3399) throw new Error("사전 검증용 빈 포트가 없습니다.");
      const app = launch(process.execPath, [join(root, "node_modules/next/dist/bin/next"), "start", "-H", "127.0.0.1", "-p", String(port)], { root, env: deploymentEnv(process.env, release), logFile: join(release.runDir, "stage.log") });
      // Keep the live process object: output and exit state are updated by launch().
      app.port = port;
      return app;
    },
    stageReady: async (app, signal) => {
      await waitForOutput(app, (text) => /Ready in/.test(text), signal);
      await waitForHttp(`http://127.0.0.1:${app.port}/login`, signal, app);
      release = { ...release, ...await fingerprint(release) };
      await health(`http://127.0.0.1:${app.port}`, release, signal);
    },
    recheck: async (target, previous) => {
      await checkTarget(target);
      const inventory = await snapshot();
      const listener = inventory.listeners.find((item) => item.port === target.port);
      const current = inventory.processes.find((item) => item.pid === listener?.pid);
      if (previous ? !sameProcess(current, previous.process) : Boolean(listener)) throw new Error("앱 프로세스가 바뀌어 교체를 중단합니다.");
    },
    stopPrevious: async (previous, target) => { if (previous) await stop(previous.process, target.port); },
    start: (target) => persistent(release, target.port, "app"),
    verify: async (target, signal) => {
      await health(`http://127.0.0.1:${target.port}`, release, signal);
      await checkTarget(target);
      await health(target.url, release, signal);
    },
    rollback: async (previous, app, target) => {
      if (app) await stop(app);
      const inventory = await snapshot();
      const listener = inventory.listeners.find((item) => item.port === target.port);
      if (listener) {
        const current = inventory.processes.find((item) => item.pid === listener.pid);
        if (!previous || !sameProcess(current, previous.process)) throw new Error("복구할 포트를 다른 프로세스가 사용합니다.");
        return current;
      }
      if (!previous) return null;
      const restored = await persistent(previous, target.port, "rollback");
      await health(`http://127.0.0.1:${target.port}`, previous, AbortSignal.timeout(60_000));
      return restored;
    },
    save: async (state) => {
      const json = JSON.stringify(state, null, 2) + "\n";
      await writeFile(join(release.runDir, "deployment.json"), json);
      await writeFile(join(runtime, "latest.json"), json);
    },
    commit: async (state) => {
      await writeFile(join(runtime, "tunnel-target.json"), JSON.stringify({ url: state.url }, null, 2));
      await writeFile(join(runtime, "active.json"), JSON.stringify({ ...state, buildId: release.buildId }, null, 2));
      await writeFile(join(release.runDir, "url.txt"), state.url + "\n");
    },
    open: async (url) => {
      if (tunnelUrl(url) !== url) throw new Error("올바르지 않은 터널 주소입니다.");
      await exec("rundll32.exe", ["url.dll,FileProtocolHandler", url], { windowsHide: true, timeout: 5000 });
    },
  };
}
