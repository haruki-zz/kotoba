import fs from 'node:fs';
import path from 'node:path';

import BetterSqlite3 from 'better-sqlite3';

const DEFAULT_DB_PATH = process.env.DATABASE_PATH ?? './data/kotoba.sqlite';

const resolvePath = (dbPath: string) =>
  dbPath === ':memory:'
    ? ':memory:'
    : path.isAbsolute(dbPath)
      ? dbPath
      : path.join(process.cwd(), dbPath);

export const getDatabasePath = (dbPath = DEFAULT_DB_PATH) => resolvePath(dbPath);

export const openDatabase = (dbPath = DEFAULT_DB_PATH) => {
  const resolvedPath = resolvePath(dbPath);
  if (resolvedPath !== ':memory:') {
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  }

  const db = new BetterSqlite3(resolvedPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
};

export type DatabaseClient = BetterSqlite3.Database;
