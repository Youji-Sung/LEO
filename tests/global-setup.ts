import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const prismaCli = createRequire(import.meta.url).resolve("prisma/build/index.js");

// 테스트 DB(test.db)를 매 실행마다 새로 만들고 마이그레이션을 적용한다. 환경 변수는 vitest.config 의 env 와 같아야 한다.
// Windows 에서는 npx 가 .cmd 라 셸 없이 실행되지 않으므로 Prisma CLI 를 node 로 직접 실행한다.
export default function globalSetup(): void {
  const root = process.cwd();
  for (const f of ["test.db", "test.db-journal"]) rmSync(path.join(root, f), { force: true });
  execFileSync(process.execPath, [prismaCli, "migrate", "deploy"], {
    cwd: root,
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "pipe",
  });
}
