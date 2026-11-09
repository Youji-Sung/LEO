import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtemp, writeFile, unlink, rmdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { setTimeout as sleep } from "node:timers/promises";

const image = process.env.LEO_TEST_IMAGE;
test("production image: isolated startup, access denial, CLI, persistent DB and backup", { skip: !image, timeout: 180_000 }, async () => {
  const suffix = `${process.pid}-${Date.now()}`;
  const container = `leo-image-check-${suffix}`;
  const candidate = `${container}-candidate`;
  const data = `${container}-data`;
  const backups = `${container}-backups`;
  const temporary = await mkdtemp(path.join(os.tmpdir(), "leo-image-check-"));
  const envFile = path.join(temporary, "fixture.env");
  const docker = (...args) => execFileSync("docker", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 90_000 });
  const mounts = ["-v", `${data}:/data`, "-v", `${backups}:/backups`];
  const env = {
    NODE_ENV: "production", LEO_PRODUCTION: "1", LEO_INVITE_ONLY: "1", LEO_ALLOW_SIGNUP: "0", CLAUDE_MOCK: "0", LEO_REQUIRE_ACCESS: "1",
    APP_URL: "https://leo-image-check.test", CF_ACCESS_ISSUER: "https://leo-image-check.cloudflareaccess.com", CF_ACCESS_AUD: randomBytes(32).toString("hex"),
    AUTH_SECRET: randomBytes(32).toString("hex"), LEO_HEALTH_TOKEN: randomBytes(32).toString("hex"), LEO_ANTHROPIC_API_KEY: randomBytes(32).toString("hex"),
    DATABASE_URL: "file:/data/leo.db", BACKUP_DIR: "/backups", LEO_API_MONTHLY_USD: "200", LEO_API_USER_DAILY_USD: "20", LEO_API_CONCURRENCY: "5", LEO_BILLING_LIMIT_CONFIRMED: "1",
  };
  await writeFile(envFile, Object.entries(env).map(([key, value]) => `${key}=${value}`).join("\n"), { mode: 0o600 });
  async function ready(target = container) {
    for (let i = 0; i < 40; i++) {
      try { docker("exec", target, "node", "scripts/healthcheck.mjs"); return; } catch { await sleep(500); }
    }
    throw new Error(`Container did not become ready: ${docker("logs", target)}`);
  }
  try {
    docker("volume", "create", data); docker("volume", "create", backups);
    docker("run", "--rm", "--network", "none", "--user", "0", ...mounts, image, "chown", "1000:1000", "/data", "/backups");
    docker("run", "--rm", "--network", "none", "--env-file", envFile, ...mounts, image, "npm", "run", "db:migrate");
    docker("run", "-d", "--name", container, "--network", "none", "--read-only", "--memory", "768m", "--cap-drop", "ALL", "--security-opt", "no-new-privileges:true", "--tmpfs", "/tmp", "--tmpfs", "/app/.next/cache:uid=1000,gid=1000", "--env-file", envFile, ...mounts, image);
    await ready();
    const statuses = JSON.parse(docker("exec", container, "node", "-e", `Promise.all(['/api/auth/me','/api/usage','/api/conversations','/api/portfolios','/api/settings','/api/health'].map(async p=>[p,(await fetch('http://127.0.0.1:3000'+p)).status])).then(r=>console.log(JSON.stringify(r)))`));
    assert.deepEqual(statuses.map((row) => row[1]), [403, 403, 403, 403, 403, 404]);
    assert.equal(docker("exec", container, "node", "-e", "console.log(process.getuid(),require('node:fs').existsSync('/app/.env'))").trim(), "1000 false");
    const issued = docker("exec", container, "npm", "run", "users", "--", "issue", "fixture@example.test", "fixture");
    assert.match(issued, /\/activate#[A-Za-z0-9_-]+/);
    const backupOutput = docker("exec", container, "npm", "run", "backup");
    const backup = backupOutput.match(/\/backups\/leo-[^\s]+\.sqlite/)?.[0];
    assert.ok(backup);
    assert.match(docker("exec", container, "npm", "run", "restore:check", "--", backup), /User: 1/);
    // Match release.sh: validate the candidate against the running app's read-only DB.
    docker("run", "-d", "--name", candidate, "--network", "none", "--env-file", envFile, "-e", "LEO_CANDIDATE=1", "-v", `${data}:/data:ro`, image);
    await ready(candidate);
    docker("rm", "-f", candidate);
    docker("restart", "--time", "10", container);
    await ready();
    assert.match(docker("exec", container, "npm", "run", "users", "--", "list"), /fixture@example.test/);
    console.log(`Image memory after startup/restart: ${docker("stats", "--no-stream", "--format", "{{.MemUsage}}", container).trim()}`);
  } finally {
    try { docker("rm", "-f", candidate); } catch {}
    try { docker("rm", "-f", container); } catch {}
    for (const volume of [data, backups]) { try { docker("volume", "rm", volume); } catch {} }
    await unlink(envFile); await rmdir(temporary);
  }
});
