import { createHash } from "node:crypto";
import { withOperationsDb } from "@/lib/sqlite-operations";
import { HttpError } from "@/lib/http-error";

export function resetSuccessfulLogin(email: string): void {
  const key = createHash("sha256").update(`account:${email}`).digest("hex");
  withOperationsDb((db) => db.prepare('DELETE FROM "LoginAttempt" WHERE "key" = ?').run(key));
}

export async function consumeLoginAttempt(headers: Headers, email: string): Promise<void> {
  // Proxy headers are trusted only on the closed, Access-protected production origin.
  const ip = process.env.LEO_REQUIRE_ACCESS === "1" ? headers.get("cf-connecting-ip") || "unknown" : "local";
  const buckets: Array<[string, number]> = [[`ip:${ip}`, 200]];
  if (email !== "activation") buckets.push([`account:${email}`, 20]);
  withOperationsDb((db) => db.transaction(() => {
    const now = Date.now();
    db.prepare('DELETE FROM "LoginAttempt" WHERE "expiresAt" <= ?').run(now);
    for (const [value, max] of buckets) {
      const key = createHash("sha256").update(value).digest("hex");
      const row = db.prepare('SELECT "count" FROM "LoginAttempt" WHERE "key" = ?').get(key) as { count: number } | undefined;
      if (row && row.count >= max) throw new HttpError(429, "로그인 시도가 많습니다. 15분 후 다시 시도해 주세요.", "too_many_attempts");
    }
    for (const [value] of buckets) {
      const key = createHash("sha256").update(value).digest("hex");
      db.prepare('INSERT INTO "LoginAttempt" ("key", "count", "expiresAt") VALUES (?, 1, ?) ON CONFLICT("key") DO UPDATE SET "count" = "count" + 1').run(key, now + 15 * 60_000);
    }
  }).immediate());
}
