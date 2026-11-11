import "dotenv/config";
import { createClient } from "@libsql/client";
import Database from "better-sqlite3";
import { mkdtemp, unlink, rmdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";
import { backupDatabase } from "./backup.mjs";

const quoted = (name) => `"${name.replaceAll('"', '""')}"`;
export async function backupRemote(client, destination) {
  const temp = await mkdtemp(path.join(os.tmpdir(), "leo-remote-backup-"));
  const source = path.join(temp, "snapshot.db");
  let db;
  let tx;
  try {
    db = new Database(source);
    db.pragma("foreign_keys = OFF");
    tx = await client.transaction("read");
    const schema = (await tx.execute("SELECT name, type, sql FROM sqlite_schema WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END, name")).rows;
    for (const table of schema.filter((row) => row.type === "table")) {
      db.exec(table.sql);
      for (let offset = 0; ; offset += 100) {
        const result = await tx.execute({ sql: `SELECT * FROM ${quoted(table.name)} LIMIT 100 OFFSET ?`, args: [offset] });
        if (!result.rows.length) break;
        const insert = db.prepare(`INSERT INTO ${quoted(table.name)} (${result.columns.map(quoted).join(",")}) VALUES (${result.columns.map(() => "?").join(",")})`);
        db.transaction(() => {
          for (const row of result.rows) insert.run(...result.columns.map((column) => row[column]));
        })();
      }
    }
    for (const item of schema.filter((row) => row.type !== "table")) db.exec(item.sql);
    await tx.commit();
    db.close(); db = undefined;
    return await backupDatabase(source, destination);
  } finally {
    if (tx && !tx.closed) await tx.rollback().catch(() => {});
    tx?.close(); db?.close();
    for (const suffix of ["", "-wal", "-shm", "-journal"]) await unlink(`${source}${suffix}`).catch((e) => { if (e.code !== "ENOENT") throw e; });
    await rmdir(temp);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (!/^libsql:\/\/(?:[a-z0-9-]+\.)+turso\.io\/?$/.test(process.env.DATABASE_URL || "") || !process.env.TURSO_AUTH_TOKEN) throw new Error("Turso 연결 정보가 필요합니다.");
  const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
  try { console.log(await backupRemote(client, process.env.BACKUP_DIR || "backups/remote")); }
  catch (e) { console.error(e instanceof Error ? e.message : "원격 백업 실패"); process.exitCode = 1; }
  finally { client.close(); }
}
