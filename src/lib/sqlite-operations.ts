import Database from "better-sqlite3";
import { resolveSqlitePath } from "@/lib/db";

// Short synchronous transactions serialize admission across app/CLI processes.
// Never hold a database transaction open during network requests.
export function withOperationsDb<T>(work: (db: Database.Database) => T): T {
  const db = new Database(resolveSqlitePath(process.env.DATABASE_URL ?? "file:./dev.db"), { fileMustExist: true, timeout: 5000 });
  try { return work(db); } finally { db.close(); }
}
