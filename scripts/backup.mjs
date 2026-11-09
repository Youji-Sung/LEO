import "dotenv/config";
import Database from "better-sqlite3";
import { mkdir, chmod, writeFile, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createHash, randomBytes } from "node:crypto";
import { createReadStream } from "node:fs";

export async function backupDatabase(source, directory, keep = Number(process.env.BACKUP_KEEP || "7")) {
  if (!Number.isInteger(keep) || keep < 1 || keep > 100) throw new Error("BACKUP_KEEP는 1~100이어야 합니다.");
  const sourcePath = path.resolve(source.replace(/^file:/, ""));
  const destination = path.resolve(directory);
  await mkdir(destination, { recursive: true, mode: 0o700 });
  const file = path.join(destination, `leo-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomBytes(4).toString("hex")}.sqlite`);
  const db = new Database(sourcePath, { readonly: true, fileMustExist: true });
  try { await db.backup(file); } finally { db.close(); }
  await chmod(file, 0o600);
  const restored = new Database(file, { fileMustExist: true });
  try {
    restored.pragma("journal_mode = DELETE");
    if (restored.pragma("integrity_check", { simple: true }) !== "ok" || restored.pragma("foreign_key_check").length) throw new Error("Backup integrity check failed");
  } finally { restored.close(); }
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  await writeFile(`${file}.sha256`, `${hash.digest("hex")}  ${path.basename(file)}\n`, { mode: 0o600 });
  // Prune only this tool's filenames, and only after the new snapshot is verified.
  const snapshots = (await readdir(destination)).filter((name) => name !== path.basename(file) && /^leo-\d{4}-\d{2}-\d{2}T[0-9-]+Z-[a-f0-9]{8}\.sqlite$/.test(name)).sort().reverse();
  for (const name of snapshots.slice(keep - 1)) {
    await unlink(path.join(destination, name));
    await unlink(path.join(destination, `${name}.sha256`)).catch((e) => { if (e.code !== "ENOENT") throw e; });
  }
  return file;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (!process.env.DATABASE_URL || !process.env.BACKUP_DIR) throw new Error("DATABASE_URL와 BACKUP_DIR가 필요합니다.");
  console.log(await backupDatabase(process.env.DATABASE_URL, process.env.BACKUP_DIR));
}
