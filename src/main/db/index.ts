import { getDatabasePath, openDatabase } from './connection';
import { runMigrations, getPendingMigrations, migrationList } from './migrations';
import { SourceRepository } from './repositories/source-repository';
import { TagRepository } from './repositories/tag-repository';
import { WordRepository } from './repositories/word-repository';
import { AiRequestRepository } from './repositories/ai-request-repository';

export const createDbContext = (dbPath?: string) => {
  const db = openDatabase(dbPath);
  runMigrations(db);

  const tagRepo = new TagRepository(db);
  const sourceRepo = new SourceRepository(db);
  const wordRepo = new WordRepository(db, tagRepo, sourceRepo);
  const aiRequestRepo = new AiRequestRepository(db);

  const close = () => db.close();

  return { db, wordRepo, tagRepo, sourceRepo, aiRequestRepo, close };
};

export { runMigrations, getPendingMigrations, migrationList, getDatabasePath };
