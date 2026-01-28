import type Database from 'better-sqlite3';
import { createWordsTable } from './schema';

type SqliteDb = Database.Database;

export const migrate = (db: SqliteDb) => {
  db.exec(createWordsTable);
};
