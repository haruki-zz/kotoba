import Database from "better-sqlite3";

import { DatabaseConfig, loadDatabaseConfig } from "./config";

export type SqliteDatabase = Database.Database;

export const createDatabaseConnection = (
  config: DatabaseConfig = loadDatabaseConfig(),
): SqliteDatabase => {
  return new Database(config.path);
};
