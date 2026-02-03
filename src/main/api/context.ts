import { createDbContext } from '../db';
import { SourceService } from '../services/source-service';
import { TagService } from '../services/tag-service';
import { WordService } from '../services/word-service';

export const createAppContext = (dbPath?: string) => {
  const dbContext = createDbContext(dbPath);
  const wordService = new WordService(
    dbContext.db,
    dbContext.wordRepo,
    dbContext.tagRepo,
    dbContext.sourceRepo
  );
  const tagService = new TagService(dbContext.tagRepo);
  const sourceService = new SourceService(dbContext.sourceRepo);

  return {
    dbContext,
    services: {
      wordService,
      tagService,
      sourceService,
    },
    close: () => dbContext.close(),
  };
};

export type AppContext = ReturnType<typeof createAppContext>;
