import Database from 'better-sqlite3';
import { ensureDirectory, resolveDatabasePath } from './paths';

export interface OpenDatabaseOptions {
  filename?: string;
  readonly?: boolean;
  fileMustExist?: boolean;
}

type SqliteDb = Database.Database;

export const openDatabase = (options: OpenDatabaseOptions = {}): SqliteDb => {
  const dbPath = resolveDatabasePath(options.filename);
  ensureDirectory(dbPath);

  const db = new Database(dbPath, {
    readonly: options.readonly ?? false,
    fileMustExist: options.fileMustExist ?? false,
  });

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  return db;
};
