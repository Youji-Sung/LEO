import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

type SqlArg = string | number | bigint | null;
export interface OperationsDb {
  get<T>(sql: string, ...args: SqlArg[]): Promise<T | undefined>;
  all<T>(sql: string, ...args: SqlArg[]): Promise<T[]>;
  run(sql: string, ...args: SqlArg[]): Promise<number>;
}
function operations(tx: Prisma.TransactionClient): OperationsDb {
  return {
    get: async <T>(sql: string, ...args: SqlArg[]) => (await tx.$queryRawUnsafe<T[]>(sql, ...args))[0],
    all: <T>(sql: string, ...args: SqlArg[]) => tx.$queryRawUnsafe<T[]>(sql, ...args),
    run: (sql, ...args) => tx.$executeRawUnsafe(sql, ...args),
  };
}

// Acquire SQLite's write lock BEFORE reading balances. Use the application pool,
// locally and on Turso. Never await model calls inside this short transaction.
export async function withOperationsDb<T>(work: (db: OperationsDb) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`INSERT INTO "RuntimeControl" ("key", "value") VALUES ('operations-lock', '1') ON CONFLICT("key") DO UPDATE SET "value" = '1'`;
    return work(operations(tx));
  });
}
