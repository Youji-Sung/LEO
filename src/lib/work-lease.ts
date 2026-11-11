import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { HttpError } from "@/lib/http-error";
import { withOperationsDb } from "@/lib/sqlite-operations";

export const WORK_LEASE_MS = 180_000;
export type WorkLease = { key: string; token: string; release(): Promise<void> };

export async function acquireWorkLease(key: string): Promise<WorkLease> {
  const token = randomUUID();
  await withOperationsDb(async (db) => {
    const previous = await db.get<{ expiresAt: string | number }>('SELECT "expiresAt" FROM "WorkLease" WHERE "key" = ?', key);
    if (previous && new Date(previous.expiresAt).getTime() > Date.now()) {
      throw new HttpError(409, "이 대화의 이전 작업이 진행 중이에요. 완료 후 다시 시도해 주세요.", "conversation_busy");
    }
    await db.run('INSERT INTO "WorkLease" ("key", "token", "expiresAt") VALUES (?, ?, ?) ON CONFLICT("key") DO UPDATE SET "token" = excluded."token", "expiresAt" = excluded."expiresAt"', key, token, new Date(Date.now() + WORK_LEASE_MS).toISOString());
  });
  let refreshing = false;
  const heartbeat = setInterval(async () => {
    if (refreshing) return;
    refreshing = true;
    try {
      const updated = await prisma.workLease.updateMany({
        where: { key, token, expiresAt: { gt: new Date() } },
        data: { expiresAt: new Date(Date.now() + WORK_LEASE_MS) },
      });
      if (!updated.count) clearInterval(heartbeat);
    } catch { /* Lease expires if connectivity does not recover. Paid calls are never replayed. */ }
    finally { refreshing = false; }
  }, 30_000);
  heartbeat.unref();
  return { key, token, async release() {
    clearInterval(heartbeat);
    await prisma.workLease.deleteMany({ where: { key, token } });
  } };
}

export async function assertWorkLease(lease: Pick<WorkLease, "key" | "token">, tx: Prisma.TransactionClient = prisma) {
  const current = await tx.workLease.findFirst({ where: { key: lease.key, token: lease.token, expiresAt: { gt: new Date() } } });
  if (!current) throw new HttpError(409, "작업 연결이 중단됐어요. 저장된 결과를 확인한 뒤 다시 시도해 주세요.", "work_interrupted");
}
