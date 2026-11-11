import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import { mkdtemp, mkdir, writeFile, unlink, rmdir, readdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { migrateRemote } from "../../scripts/migrate-remote.mjs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { backupRemote } from "../../scripts/backup-remote.mjs";
import Database from "better-sqlite3";

async function checkMigrations(temp) {
  const migrations = path.join(temp, "migrations");
  const first = path.join(migrations, "001");
  const second = path.join(migrations, "002");
  const client = createClient({ url: `file:${path.join(temp, "fixture.db")}` });
  try {
    await mkdir(first, { recursive: true });
    await writeFile(path.join(first, "migration.sql"), "CREATE TABLE fixture(id TEXT PRIMARY KEY, text TEXT); INSERT INTO fixture VALUES ('1','one; two');\n");
    assert.deepEqual(await migrateRemote(client, migrations), ["001"]);
    assert.deepEqual(await migrateRemote(client, migrations), []);
    assert.equal((await client.execute("SELECT text FROM fixture")).rows[0].text, "one; two");
    const backup = await backupRemote(client, path.join(temp, "backups"));
    const restored = new Database(backup, { readonly: true });
    try { assert.equal(restored.prepare("SELECT text FROM fixture").get().text, "one; two"); }
    finally { restored.close(); }
    await mkdir(second);
    await writeFile(path.join(second, "migration.sql"), "CREATE TABLE should_rollback(id TEXT); INSERT INTO nonexistent VALUES (1);");
    await assert.rejects(migrateRemote(client, migrations));
    assert.equal((await client.execute("SELECT name FROM sqlite_schema WHERE name='should_rollback'")).rows.length, 0);
    assert.equal((await client.execute("SELECT * FROM _prisma_migrations")).rows.length, 1);
    await writeFile(path.join(first, "migration.sql"), "CREATE TABLE modified(id TEXT);");
    await assert.rejects(migrateRemote(client, migrations), /이력/);
  } finally {
    client.close();
  }
}
if (process.argv[2] === "--fixture") {
  await checkMigrations(process.argv[3]);
} else test("remote migration runner is atomic, repeatable and rejects changed history", async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), "leo-migrations-"));
  const migrations = path.join(temp, "migrations");
  const first = path.join(migrations, "001");
  const second = path.join(migrations, "002");
  try {
    // libSQL native connections on Windows release all file handles on process exit.
    execFileSync(process.execPath, [fileURLToPath(import.meta.url), "--fixture", temp], { stdio: "pipe" });
  } finally {
    for (const dir of [first, second]) { await unlink(path.join(dir, "migration.sql")).catch(() => {}); await rmdir(dir).catch(() => {}); }
    await rmdir(migrations);
    for (const file of await readdir(path.join(temp, "backups")).catch(() => [])) await unlink(path.join(temp, "backups", file));
    await rmdir(path.join(temp, "backups")).catch(() => {});
    for (const suffix of ["", "-wal", "-shm", "-journal"]) await unlink(path.join(temp, `fixture.db${suffix}`)).catch(() => {});
    await rmdir(temp);
  }
});
