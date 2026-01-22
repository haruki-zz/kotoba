import { loadDatabaseConfig } from "./config.js";
import { createDatabaseConnection, type SqliteDatabase } from "./connection.js";
import { migrations } from "./migrations/index.js";
import { applyMigrations } from "./migrator.js";
import { WordRepository } from "./word-repository.js";

export type DataAccessLayer = {
  db: SqliteDatabase;
  words: WordRepository;
};

export const initializeDatabase = (): DataAccessLayer => {
  const config = loadDatabaseConfig();
  const db = createDatabaseConnection(config);
  applyMigrations(db, migrations);

  return {
    db,
    words: new WordRepository(db),
  };
};
