import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { abortable } from "./deploy-runtime.mjs";
import { realServices } from "./deploy-windows.mjs";

export { deploymentEnv, findFreePort, launch, prepareRelease, tunnelUrl } from "./deploy-runtime.mjs";

// Existing tunnel only: no operation creates or stops a tunnel.
export async function deploy(services, { signal, checkOnly = false, buildOnly = false }) {
  const owned = [];
  let unlock, state, target, previous, app;
  let switching = false;
  try {
    signal.throwIfAborted();
    await services.check();
    if (!checkOnly) unlock = await services.lock();
    if (!buildOnly) {
      target = await services.target();
      previous = await services.previous(target);
      services.say(`[1/4] 기존 주소 유지: ${target.url} (포트 ${target.port})`);
    }
    if (checkOnly) { services.say("사전 점검 완료. 서버와 터널은 변경하지 않았습니다."); return; }
    state = { ...await services.prepare(), status: "building", url: target?.url ?? null, port: target?.port ?? null, tunnel: target?.process ?? null, previousApp: previous?.process ?? null };
    await services.save(state);
    services.say(`[2/4] 최신 코드를 별도 폴더에 빌드합니다. 로그: ${state.runDir}`);
    signal.throwIfAborted();
    const build = services.build();
    owned.push(build);
    const result = await abortable(build.done, signal);
    if (result.code !== 0) throw new Error("빌드 실패. 기존 서버는 유지합니다. build.log를 확인해 주세요.");
    if (buildOnly) { state.status = "built"; await services.save(state); services.say("빌드 완료. 서버와 터널은 변경하지 않았습니다."); return; }
    signal.throwIfAborted();
    state.status = "staging";
    await services.save(state);
    services.say("[3/4] 임시 포트에서 새 앱을 검사합니다. 기존 서버는 계속 서비스합니다.");
    const stage = await services.stage();
    owned.push(stage);
    await services.stageReady(stage, signal);
    await stage.stop();
    await services.recheck(target, previous);
    signal.throwIfAborted();
    state.status = "switching";
    await services.save(state);
    services.say("[4/4] 기존 포트의 앱만 교체합니다. 잠깐 접속이 끊길 수 있습니다. 터널과 주소는 유지합니다.");
    switching = true;
    await services.stopPrevious(previous, target);
    signal.throwIfAborted();
    app = await services.start(target);
    state.app = app;
    await services.verify(target, signal);
    signal.throwIfAborted();
    state.status = "running";
    await services.save(state);
    await services.commit(state);
    switching = false;
    services.say(`\n배포 완료: ${target.url}\n기존 주소에서 새 빌드와 로그인 화면을 확인했습니다. 이 창을 닫아도 서버와 터널은 유지됩니다.\n`);
    try { await services.open(target.url); }
    catch { services.say("브라우저를 열지 못했습니다. 위의 기존 주소로 접속해 주세요."); }
    return state;
  } catch (error) {
    if (state) { state.error = error.message; state.status = "failed"; }
    if (switching) {
      try {
        const restored = await services.rollback(previous, app, target);
        if (state) { state.status = "rolled_back"; state.app = restored; }
        services.say(previous ? "배포에 실패해 이전 앱으로 복구했습니다. 터널은 유지합니다." : "배포 실패로 새 앱만 정리했습니다. 터널은 유지합니다.");
      } catch (rollbackError) {
        if (state) state.rollbackError = rollbackError.message;
        services.say(`앱 복구 확인 실패: ${rollbackError.message}`);
      }
    }
    if (state) await services.save(state);
    throw error;
  } finally {
    try {
      const results = await Promise.allSettled(owned.map((child) => child.stop()));
      const failure = results.find((result) => result.status === "rejected");
      if (failure) throw failure.reason;
    } finally { await unlock?.(); }
  }
}

async function main() {
  const args = process.argv.slice(2);
  let url;
  const index = args.indexOf("--url");
  if (index !== -1) {
    url = args[index + 1];
    if (!url || !/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(url)) throw new Error("--url 뒤에 현재 사용 중인 HTTPS 터널 주소를 입력해 주세요.");
    args.splice(index, 2);
  }
  if (args.some((arg) => !["--check", "--build-only"].includes(arg)) || args.length > 1) throw new Error("사용법: deploy.bat [--check | --build-only] [--url <기존 주소>]");
  const controller = new AbortController();
  const stop = () => controller.abort(new Error("사용자가 배포를 중단했습니다."));
  for (const event of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(event, stop);
  try {
    await deploy(realServices(undefined, url), { signal: controller.signal, checkOnly: args.includes("--check"), buildOnly: args.includes("--build-only") });
  } finally {
    for (const event of ["SIGINT", "SIGTERM", "SIGHUP"]) process.off(event, stop);
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => { console.error(`\n배포 실패: ${error.message}`); process.exitCode = 1; });
}
