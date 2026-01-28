import type Database from 'better-sqlite3';
import { openDatabase, OpenDatabaseOptions } from './connection';
import { migrate } from './migrate';

export * from './connection';
export * from './migrate';
export * from './words-repository';

export const connectDatabase = (options?: OpenDatabaseOptions): Database.Database => {
  const db = openDatabase(options);
  migrate(db);
  return db;
};
