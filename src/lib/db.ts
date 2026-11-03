import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

// Prisma CLI 는 `file:./x.db` 를 프로젝트 루트(cwd) 기준으로 해석한다. 런타임도 같은 파일을 쓰도록 맞춘다.
export function resolveSqlitePath(databaseUrl: string): string {
  const raw = databaseUrl.replace(/^file:/, "");
  if (raw === ":memory:") return raw;
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const adapter = new PrismaBetterSqlite3({ url: resolveSqlitePath(url) });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { leoPrisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.leoPrisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.leoPrisma = prisma;
}
