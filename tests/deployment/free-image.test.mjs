// Opt-in only: uses a dedicated Turso DB. Never calls the model or changes accounts.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { parse } from "dotenv";

const image = process.env.LEO_TEST_IMAGE;
const envFile = process.env.LEO_FREE_SMOKE_ENV;
test("free profile starts within 512 MB / 0.1 CPU and denies anonymous model access", { skip: !image || !envFile, timeout: 240_000 }, async () => {
  const container = `leo-free-check-${process.pid}-${Date.now()}`;
  const docker = (...args) => execFileSync("docker", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000 });
  const publicUrl = "https://leo-free-check.onrender.com";
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "leo-free-image-"));
  try {
    // Docker's --env-file keeps quotes, unlike dotenv and Render's importer.
    const parsed = parse(fs.readFileSync(path.resolve(envFile)));
    assert.ok(Object.values(parsed).every((value) => !/[\r\n]/.test(value)), "Docker environment values must be single-line");
    const dockerEnv = path.join(temp, "runtime.env");
    fs.writeFileSync(dockerEnv, Object.entries(parsed).map(([key, value]) => `${key}=${value}`).join("\n"), { mode: 0o600 });
    const started = Date.now();
    docker("run", "-d", "--name", container, "--read-only", "--memory", "512m", "--cpus", "0.1", "--cap-drop", "ALL", "--security-opt", "no-new-privileges:true", "--tmpfs", "/tmp", "--tmpfs", "/app/.next/cache:uid=1000,gid=1000", "-p", "127.0.0.1::3000", "--env-file", dockerEnv, "-e", "RENDER=true", "-e", `RENDER_EXTERNAL_URL=${publicUrl}`, image);
    const origin = "http://" + docker("port", container, "3000/tcp").trim();
    let ready = false;
    for (let attempt = 0; attempt < 120; attempt++) {
      try { if ((await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(2000) })).status === 204) { ready = true; break; } } catch {}
      if (attempt % 10 === 0 && docker("inspect", "--format", "{{.State.Running}}", container).trim() !== "true") break;
      await sleep(1000);
    }
    assert.ok(ready, "Free profile failed to start");
    console.log(`Free profile startup: ${Date.now() - started} ms`);
    const loginStarted = Date.now();
    assert.equal((await fetch(`${origin}/login`)).status, 200);
    console.log(`First login HTML after readiness: ${Date.now() - loginStarted} ms`);
    for (const route of ["/api/auth/me", "/api/settings", "/api/conversations", "/api/usage", "/api/portfolios"]) {
      assert.equal((await fetch(origin + route)).status, 401);
    }
    const headers = { "content-type": "application/json", origin: publicUrl };
    assert.equal((await fetch(`${origin}/api/conversations`, { method: "POST", headers, body: "{}" })).status, 401);
    assert.equal((await fetch(`${origin}/api/auth/signup`, { method: "POST", headers, body: "{}" })).status, 403);
    assert.equal((await fetch(`${origin}/api/conversations`, { method: "POST", headers: { ...headers, origin: "https://untrusted.test" }, body: "{}" })).status, 403);
    console.log(`Free profile memory: ${docker("stats", "--no-stream", "--format", "{{.MemUsage}}", container).trim()}`);
    assert.equal(docker("inspect", "--format", "{{.State.OOMKilled}}", container).trim(), "false");
  } finally {
    try { docker("rm", "-f", container); } catch {}
    fs.rmSync(path.join(temp, "runtime.env"), { force: true });
    fs.rmdirSync(temp);
  }
});
