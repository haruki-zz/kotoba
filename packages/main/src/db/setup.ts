import { loadDatabaseConfig } from "./config";
import { createDatabaseConnection, type SqliteDatabase } from "./connection";
import { migrations } from "./migrations";
import { applyMigrations } from "./migrator";
import { WordRepository } from "./word-repository";

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
