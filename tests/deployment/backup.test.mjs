import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readdir, unlink, rmdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import Database from "better-sqlite3";
import { backupDatabase } from "../../scripts/backup.mjs";
import { verifyRestore } from "../../scripts/restore-check.mjs";

test("online WAL backup restores committed records and detects tampering", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "leo-backup-test-"));
  const source = path.join(dir, "source.sqlite");
  const db = new Database(source);
  try {
    db.pragma("journal_mode = WAL");
    for (const name of ["User", "Conversation", "Message", "Report"]) db.exec(`CREATE TABLE "${name}" (id TEXT PRIMARY KEY)`);
    db.exec('INSERT INTO "User" VALUES (\'u1\'); INSERT INTO "Message" VALUES (\'m1\')');
    const file = await backupDatabase(source, dir);
    db.exec('INSERT INTO "Message" VALUES (\'m2\')');
    assert.deepEqual(await verifyRestore(file), { User: 1, Conversation: 0, Message: 1, Report: 0 });
    await writeFile(file, "corrupted");
    await assert.rejects(verifyRestore(file), /checksum/);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM "Message"').get().n, 2);
    await writeFile(path.join(dir, "keep-me.txt"), "unrelated");
    for (let i = 0; i < 3; i++) await backupDatabase(source, dir, 2);
    const files = await readdir(dir);
    assert.equal(files.filter((name) => name.startsWith("leo-") && name.endsWith(".sqlite")).length, 2);
    assert.ok(files.includes("keep-me.txt"));
  } finally {
    db.close();
    for (const file of await readdir(dir)) await unlink(path.join(dir, file));
    await rmdir(dir);
  }
});
