import Database from "better-sqlite3";
import { copyFile, mkdtemp, readFile, unlink, rmdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";

export async function verifyRestore(backup) {
  const source = path.resolve(backup);
  const expected = (await readFile(`${source}.sha256`, "utf8")).split(/\s+/)[0];
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(source)) hash.update(chunk);
  if (hash.digest("hex") !== expected) throw new Error("Backup checksum mismatch");
  const temporary = await mkdtemp(path.join(os.tmpdir(), "leo-restore-check-"));
  const target = path.join(temporary, "restored.sqlite");
  try {
    await copyFile(source, target);
    const db = new Database(target, { readonly: true, fileMustExist: true });
    try {
      if (db.pragma("integrity_check", { simple: true }) !== "ok" || db.pragma("foreign_key_check").length) throw new Error("Restore integrity check failed");
      return Object.fromEntries(["User", "Conversation", "Message", "Report"].map((table) => [table, db.prepare(`SELECT COUNT(*) AS n FROM "${table}"`).get().n]));
    } finally { db.close(); }
  } finally {
    for (const suffix of ["", "-wal", "-shm", "-journal"]) await unlink(target + suffix).catch(() => {});
    await rmdir(temporary);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (!process.argv[2]) throw new Error("복원 검증할 백업 파일 경로가 필요합니다.");
  console.log(await verifyRestore(process.argv[2]));
}
