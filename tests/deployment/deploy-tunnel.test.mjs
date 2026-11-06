import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:net";
import { once } from "node:events";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { deploymentEnv, findFreePort, launch, prepareRelease, tunnelUrl } from "../../scripts/deploy-tunnel.mjs";

test("Windows app stop verifies process creation time before stopping an isolated fixture", { skip: process.platform !== "win32" }, async () => {
  const root = await mkdtemp(join(tmpdir(), "leo ownership test "));
  const child = launch(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { root, env: process.env, logFile: join(root, "fixture.log") });
  const exec = promisify(execFile);
  const script = fileURLToPath(new URL("../../scripts/deploy-process.ps1", import.meta.url));
  const args = ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", script];
  try {
    const inventory = JSON.parse((await exec("powershell.exe", [...args, "-Action", "snapshot"], { windowsHide: true, maxBuffer: 4_000_000 })).stdout);
    const identity = inventory.processes.find((item) => item.pid === child.pid);
    assert.ok(identity);
    await assert.rejects(exec("powershell.exe", [...args, "-Action", "stop", "-TargetPid", String(child.pid), "-ExpectedStartedAt", "wrong-time"], { windowsHide: true }));
    assert.equal(process.kill(child.pid, 0), true);
    await exec("powershell.exe", [...args, "-Action", "stop", "-TargetPid", String(child.pid), "-ExpectedStartedAt", identity.startedAt], { windowsHide: true });
    await child.done;
    assert.equal(child.ended, true);
  } finally { await child.stop(); }
});

test("Windows process cleanup stops the owned fixture and leaves a separate fixture alive", { skip: process.platform !== "win32" }, async () => {
  const root = await mkdtemp(join(tmpdir(), "leo process test "));
  const options = { root, env: process.env };
  const fixture = 'process.stdout.write("fixture ready"); setInterval(() => {}, 1000);';
  const existing = launch(process.execPath, ["-e", fixture], { ...options, logFile: join(root, "existing.log") });
  const owned = launch(process.execPath, ["-e", fixture], { ...options, logFile: join(root, "owned.log") });
  try {
    const deadline = Date.now() + 10_000;
    while (![existing, owned].every((child) => child.text.includes("fixture ready"))) {
      assert.ok(!existing.ended && !owned.ended && Date.now() < deadline, "fixtures must start");
      await sleep(50);
    }
    await owned.stop();
    assert.equal(owned.ended, true);
    assert.equal(existing.ended, false);
    assert.equal(process.kill(existing.pid, 0), true);
    await owned.stop(); // Repeated cleanup must never target a recycled PID.
  } finally {
    await Promise.all([owned.stop(), existing.stop()]);
  }
});

test("child environment preserves the model and database without modifying the parent", () => {
  const base = { APP_URL: "http://localhost:3000", LEO_CLAUDE_MODEL: "claude-opus-5", DATABASE_URL: "file:./dev.db", LEO_ALLOW_SIGNUP: "1", CLAUDE_MOCK: "1" };
  const before = structuredClone(base);
  const env = deploymentEnv(base, { distDir: ".next-release-unique", tsconfigPath: ".leo-runtime/unique/tsconfig.json" });
  assert.deepEqual(base, before);
  assert.equal(env.APP_URL, "https://tunnel");
  assert.equal(env.LEO_ALLOW_SIGNUP, "0");
  assert.equal(env.CLAUDE_MOCK, "0");
  assert.equal(env.LEO_CLAUDE_MODEL, before.LEO_CLAUDE_MODEL);
  assert.equal(env.DATABASE_URL, before.DATABASE_URL);
  assert.equal(env.NEXT_DIST_DIR, ".next-release-unique");
});

test("port selection skips a live listener and leaves it running", async () => {
  const existing = createServer();
  existing.listen(0, "127.0.0.1");
  await once(existing, "listening");
  try {
    const port = existing.address().port;
    assert.equal(await findFreePort(port, Math.min(port + 10, 65535)) > port, true);
    assert.equal(existing.listening, true);
    await assert.rejects(findFreePort(port, port), /모두 사용 중/);
  } finally { existing.close(); }
});

test("extracts only HTTPS trycloudflare hostnames, including a URL split across log chunks", () => {
  assert.equal(tunnelUrl("INF https://bright-" + "leo.trycloudflare.com |\n"), "https://bright-leo.trycloudflare.com");
  for (const input of ["https://evil.example", "https://leo.trycloudflare.com.evil.example", "http://leo.trycloudflare.com", "https://leo.trycloudflare.com@evil.example"]) {
    assert.equal(tunnelUrl(input), null);
  }
});

test("release config is unique and never rewrites root tsconfig or env, including paths with spaces", async () => {
  const root = await mkdtemp(join(tmpdir(), "leo deploy test "));
  const config = '{\n  // user config stays intact\n  "compilerOptions": {"strict": true}, "include": ["src/**/*.ts"]\n}\n';
  await writeFile(join(root, "tsconfig.json"), config);
  await writeFile(join(root, ".env"), "APP_URL=http://localhost:3000\n");
  const [a, b] = await Promise.all([prepareRelease(root), prepareRelease(root)]);
  assert.notEqual(a.distDir, b.distDir);
  assert.ok(a.distDir.startsWith(".next-release-"));
  const generated = JSON.parse(await readFile(join(root, a.tsconfigPath), "utf8"));
  assert.equal(generated.extends, "../../tsconfig.json");
  assert.ok(generated.include.some((pattern) => pattern.endsWith(`${a.distDir}/types/**/*.ts`)));
  assert.equal(await readFile(join(root, "tsconfig.json"), "utf8"), config);
  assert.equal(await readFile(join(root, ".env"), "utf8"), "APP_URL=http://localhost:3000\n");
});
