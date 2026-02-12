import { getDatabasePath, openDatabase } from './connection';
import { runMigrations, getPendingMigrations, migrationList } from './migrations';
import { AiRequestRepository } from './repositories/ai-request-repository';
import { AppMetaRepository } from './repositories/app-meta-repository';
import { SourceRepository } from './repositories/source-repository';
import { TagRepository } from './repositories/tag-repository';
import { WordRepository } from './repositories/word-repository';

export const createDbContext = (dbPath?: string) => {
  const databasePath = getDatabasePath(dbPath);
  const db = openDatabase(dbPath);
  runMigrations(db);

  const tagRepo = new TagRepository(db);
  const sourceRepo = new SourceRepository(db);
  const wordRepo = new WordRepository(db, tagRepo, sourceRepo);
  const aiRequestRepo = new AiRequestRepository(db);
  const appMetaRepo = new AppMetaRepository(db);

  const close = () => db.close();

  return { db, databasePath, wordRepo, tagRepo, sourceRepo, aiRequestRepo, appMetaRepo, close };
};

export { runMigrations, getPendingMigrations, migrationList, getDatabasePath };
