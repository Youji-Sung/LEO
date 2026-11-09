import "dotenv/config";
import { readdir } from "node:fs/promises";
import { prisma } from "../src/lib/db";
async function main() {
  const required = (await readdir("prisma/migrations", { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);
  const applied = await prisma.$queryRaw<Array<{ migration_name: string }>>`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
  const missing = required.filter((name) => !applied.some((row) => row.migration_name === name));
  if (missing.length) throw new Error(`DB 마이그레이션이 필요합니다. 기존 서버는 유지합니다. 백업 후 별도로 적용하세요: ${missing.join(", ")}`);
}
main().catch((e) => { console.error(e instanceof Error ? e.message : "DB 확인 실패"); process.exitCode = 1; }).finally(() => prisma.$disconnect());
