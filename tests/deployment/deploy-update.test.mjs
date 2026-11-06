import { test } from "node:test";
import assert from "node:assert/strict";
import { deploy } from "../../scripts/deploy-tunnel.mjs";
import { originPort, sameProcess } from "../../scripts/deploy-windows.mjs";

function fixture(overrides = {}) {
  const controller = new AbortController();
  const calls = [], states = [];
  const target = { url: "https://original-leo.trycloudflare.com", port: 3200, process: { pid: 1, startedAt: "tunnel-time" } };
  const previous = { distDir: ".next", process: { pid: 2, startedAt: "old-time" } };
  const app = { pid: 3, startedAt: "new-time" };
  const services = {
    say: () => {},
    check: async () => { calls.push("check"); },
    lock: async () => { calls.push("lock"); return async () => { calls.push("unlock"); }; },
    target: async () => { calls.push("target"); return target; },
    previous: async () => previous,
    prepare: async () => { calls.push("prepare"); return { distDir: ".next-release-new", runDir: "fixture" }; },
    build: () => { calls.push("build"); return { done: Promise.resolve({ code: 0 }), stop: async () => { calls.push("stop-build"); } }; },
    stage: async () => { calls.push("stage"); return { stop: async () => { calls.push("stop-stage"); } }; },
    stageReady: async () => { calls.push("stage-ready"); },
    recheck: async () => { calls.push("recheck"); },
    stopPrevious: async () => { calls.push("stop-previous"); },
    start: async () => { calls.push("start"); return app; },
    verify: async (actual) => { assert.equal(actual.url, target.url); calls.push("verify"); },
    rollback: async () => { calls.push("rollback"); return previous.process; },
    save: async (state) => { states.push(structuredClone(state)); },
    commit: async () => { calls.push("commit"); },
    open: async (url) => { assert.equal(url, target.url); calls.push("open"); },
    ...overrides,
  };
  return { controller, calls, states, target, previous, app, services, run: (options = {}) => deploy(services, { signal: controller.signal, ...options }) };
}

test("builds and validates before replacing only the app, preserving the tunnel and URL", async () => {
  const f = fixture();
  const state = await f.run();
  assert.equal(state.status, "running");
  assert.equal(state.url, f.target.url);
  assert.deepEqual(state.tunnel, f.target.process);
  assert.deepEqual(state.app, f.app);
  assert.ok(f.calls.indexOf("stage-ready") < f.calls.indexOf("stop-previous"));
  assert.ok(f.calls.indexOf("recheck") < f.calls.indexOf("stop-previous"));
  assert.ok(f.calls.indexOf("verify") < f.calls.indexOf("commit"));
  assert.equal(f.calls.at(-1), "unlock");
  assert.ok(!f.calls.includes("rollback"));
});

test("missing existing tunnel fails without a build or replacement", async () => {
  const f = fixture({ target: async () => { throw new Error("no existing tunnel"); } });
  await assert.rejects(f.run(), /no existing tunnel/);
  assert.deepEqual(f.calls, ["check", "lock", "unlock"]);
});

test("check-only is read-only", async () => {
  const f = fixture(); await f.run({ checkOnly: true });
  assert.deepEqual(f.calls, ["check", "target"]); assert.equal(f.states.length, 0);
});

test("build-only needs no tunnel and never touches a server", async () => {
  const f = fixture(); await f.run({ buildOnly: true });
  assert.ok(!f.calls.includes("target")); assert.ok(!f.calls.includes("stage"));
  assert.equal(f.states.at(-1).status, "built");
});

test("failed build cannot take down the old server", async () => {
  const f = fixture({ build: () => ({ done: Promise.resolve({ code: 1 }), stop: async () => {} }) });
  await assert.rejects(f.run(), /빌드 실패/);
  assert.ok(!f.calls.includes("stop-previous")); assert.ok(!f.calls.includes("stage"));
});

for (const step of ["stageReady", "recheck"]) {
  test(`${step} failure preserves the old server`, async () => {
    const f = fixture({ [step]: async () => { throw new Error("not safe"); } });
    await assert.rejects(f.run(), /not safe/);
    assert.ok(!f.calls.includes("stop-previous")); assert.ok(f.calls.includes("stop-stage"));
  });
}

for (const step of ["start", "verify", "commit"]) {
  test(`${step} failure restores the previous app without replacing the tunnel`, async () => {
    const f = fixture({ [step]: async () => { throw new Error("deployment failed"); } });
    await assert.rejects(f.run(), /deployment failed/);
    assert.ok(f.calls.includes("rollback"));
    assert.equal(f.states.at(-1).status, "rolled_back");
    assert.equal(f.states.at(-1).url, f.target.url);
  });
}

test("cancellation after stopping the old app restores service", async () => {
  const f = fixture();
  f.services.stopPrevious = async () => f.controller.abort(new Error("cancel"));
  await assert.rejects(f.run(), /cancel/);
  assert.ok(f.calls.includes("rollback")); assert.ok(!f.calls.includes("start"));
});

test("cancellation during a build never reaches cutover", async () => {
  const f = fixture();
  f.services.build = () => { f.controller.abort(new Error("cancel")); return { done: new Promise(() => {}), stop: async () => {} }; };
  await assert.rejects(f.run(), /cancel/);
  assert.ok(!f.calls.includes("stop-previous"));
});

test("rollback errors are retained instead of claiming success", async () => {
  const f = fixture({ verify: async () => { throw new Error("offline"); }, rollback: async () => { throw new Error("port occupied"); } });
  await assert.rejects(f.run(), /offline/);
  assert.equal(f.states.at(-1).status, "failed");
  assert.equal(f.states.at(-1).rollbackError, "port occupied");
});

test("failure to open the browser leaves the verified app running", async () => {
  const f = fixture({ open: async () => { throw new Error("browser unavailable"); } });
  assert.equal((await f.run()).status, "running"); assert.ok(!f.calls.includes("rollback"));
});

test("identifies only loopback tunnel origins and matches process creation time", () => {
  assert.equal(originPort('cloudflared.exe tunnel --url http://127.0.0.1:3200'), 3200);
  assert.equal(originPort('cloudflared.exe tunnel --url="http://localhost:3201"'), 3201);
  for (const command of ['--url https://example.com:3200', '--url http://evil.example:3200', '--url http://127.0.0.1:3200.evil']) assert.equal(originPort(command), null);
  assert.equal(sameProcess({ pid: 1, startedAt: "a" }, { pid: 1, startedAt: "b" }), false);
  assert.equal(sameProcess({ pid: 1, startedAt: "a" }, { pid: 1, startedAt: "a" }), true);
});
