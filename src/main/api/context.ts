import { ProviderRegistry } from '../ai/provider-registry';
import { GeminiProvider } from '../ai/providers/gemini-provider';
import { MockProvider } from '../ai/providers/mock-provider';
import { OpenAiProvider } from '../ai/providers/openai-provider';
import { createDbContext } from '../db';
import { AiService } from '../services/ai-service';
import { SettingsService } from '../services/settings-service';
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
  const settingsService = new SettingsService(
    dbContext.db,
    dbContext.appMetaRepo,
    dbContext.databasePath
  );

  const aiRegistry = new ProviderRegistry(
    {
      openai: new OpenAiProvider(),
      gemini: new GeminiProvider(),
      mock: new MockProvider(),
    },
    (process.env.AI_PROVIDER as 'mock' | 'openai' | 'gemini') ?? 'mock',
    Number(process.env.AI_MAX_CONCURRENCY ?? 3)
  );
  const aiService = new AiService(aiRegistry, dbContext.aiRequestRepo, dbContext.wordRepo);

  return {
    dbContext,
    services: {
      wordService,
      tagService,
      sourceService,
      aiService,
      settingsService,
    },
    providers: {
      aiRegistry,
    },
    close: () => dbContext.close(),
  };
};

export type AppContext = ReturnType<typeof createAppContext>;
