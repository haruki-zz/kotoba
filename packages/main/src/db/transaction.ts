import type { SqliteDatabase } from "./connection.js";

export const runInTransaction = <T>(
  db: SqliteDatabase,
  handler: () => T,
): T => {
  const execute = db.transaction(handler);
  return execute();
};
