import "dotenv/config";
import { createClient } from "@libsql/client";
import { createHash, randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export async function migrateRemote(client, directory = "prisma/migrations") {
  await client.execute(`CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" TEXT PRIMARY KEY NOT NULL, "checksum" TEXT NOT NULL, "finished_at" DATETIME,
    "migration_name" TEXT NOT NULL, "logs" TEXT, "rolled_back_at" DATETIME,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "applied_steps_count" INTEGER NOT NULL DEFAULT 0
  )`);
  const migrations = (await readdir(directory, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  const applied = [];
  for (const name of migrations) {
    // Canonical line endings give the same checksum on Windows, GitHub and Render.
    const sql = (await readFile(path.join(directory, name, "migration.sql"), "utf8")).replace(/\r\n/g, "\n");
    if (/\b(?:BEGIN|COMMIT|ROLLBACK|PRAGMA\s+foreign_keys)\b/i.test(sql)) throw new Error(`수동 검토가 필요한 마이그레이션: ${name}`);
    const checksum = createHash("sha256").update(sql).digest("hex");
    const tx = await client.transaction("write");
    try {
      const existing = (await tx.execute({ sql: 'SELECT "checksum", "finished_at", "rolled_back_at" FROM "_prisma_migrations" WHERE "migration_name" = ?', args: [name] })).rows[0];
      if (existing) {
        if (!existing.finished_at || existing.rolled_back_at || existing.checksum !== checksum) throw new Error(`마이그레이션 이력이 일치하지 않습니다: ${name}`);
      } else {
        await tx.executeMultiple(sql);
        const now = new Date().toISOString();
        await tx.execute({ sql: 'INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "finished_at", "started_at", "applied_steps_count") VALUES (?, ?, ?, ?, ?, 1)', args: [randomUUID(), checksum, name, now, now] });
        applied.push(name);
      }
      await tx.commit();
    } catch (error) { await tx.rollback().catch(() => {}); throw error; }
    finally { tx.close(); }
  }
  const violations = await client.execute("PRAGMA foreign_key_check");
  if (violations.rows.length) throw new Error("DB 외래 키 무결성 검사 실패");
  return applied;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (!/^libsql:\/\/(?:[a-z0-9-]+\.)+turso\.io\/?$/.test(process.env.DATABASE_URL || "") || !process.env.TURSO_AUTH_TOKEN) throw new Error("Turso DATABASE_URL와 TURSO_AUTH_TOKEN이 필요합니다.");
  const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
  try { console.log("Applied migrations:", await migrateRemote(client)); }
  catch (e) { console.error(e instanceof Error ? e.message : "마이그레이션 실패"); process.exitCode = 1; }
  finally { client.close(); }
}
