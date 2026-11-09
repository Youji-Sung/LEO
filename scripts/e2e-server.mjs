// E2E 전용 서버: 모의 Claude, 별도 SQLite 파일(프로젝트 루트의 e2e.db), 짧은 통화 시간 허용.
// bash 가 아니라 node 로 직접 띄워야 Windows 에서 Playwright 가 테스트 종료 후 서버 프로세스를 끝낼 수 있다.
import { spawn, spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const port = process.argv[2] ?? "3100";

for (const f of ["e2e.db", "e2e.db-journal"]) rmSync(path.join(root, f), { force: true });

const env = {
  ...process.env,
  DATABASE_URL: "file:./e2e.db",
  CLAUDE_MOCK: "1",
  AUTH_SECRET: process.env.AUTH_SECRET ?? "e2e-secret-e2e-secret-e2e-secret-0000",
  SEED_USER_PASSWORD: process.env.SEED_USER_PASSWORD ?? "leo-pass-1234",
  LEO_ALLOW_SHORT_CALLS: "1",
  LEO_ALLOW_SIGNUP: "1",
  LEO_INVITE_ONLY: "0",
  LEO_PRODUCTION: "0",
  LEO_REQUIRE_ACCESS: "0",
  LEO_API_MONTHLY_USD: "",
  APP_URL: `http://localhost:${port}`,
  NEXT_DIST_DIR: ".next-e2e",
};

// 패키지 exports 에 막히지 않도록 package.json 의 bin 으로 CLI 진입 파일을 찾는다.
const bin = (pkg, name) => {
  const dir = path.dirname(require.resolve(`${pkg}/package.json`));
  const b = require(`${pkg}/package.json`).bin;
  return path.join(dir, typeof b === "string" ? b : b[name ?? pkg]);
};
const prisma = bin("prisma");
const tsx = bin("tsx");
const next = bin("next");

for (const args of [[prisma, "migrate", "deploy"], [tsx, "prisma/seed.ts"]]) {
  const r = spawnSync(process.execPath, args, { cwd: root, env, stdio: ["ignore", "ignore", "inherit"] });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const child = spawn(process.execPath, [next, "dev", "--port", port], { cwd: root, env, stdio: "inherit" });
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
child.on("exit", (code) => process.exit(code ?? 0));
