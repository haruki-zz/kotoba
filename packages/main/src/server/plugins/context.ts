import fp from "fastify-plugin";

import { type DataAccessLayer, initializeDatabase } from "../../db/setup.js";
import { resolveAiConfig } from "../ai/config.js";
import { GeminiProvider } from "../ai/providers/gemini-provider.js";
import { MockAiProvider } from "../ai/providers/mock-provider.js";
import { OpenAiProvider } from "../ai/providers/openai-provider.js";
import { AiService } from "../ai/service.js";
import { ReviewService } from "../services/review-service.js";
import { SettingsService } from "../services/settings-service.js";
import { StatsService } from "../services/stats-service.js";

export type AppContext = {
  data: DataAccessLayer;
  aiService: AiService;
  reviewService: ReviewService;
  settingsService: SettingsService;
  statsService: StatsService;
};

declare module "fastify" {
  interface FastifyInstance {
    ctx: AppContext;
  }
}

export const contextPlugin = fp((app, _opts, done) => {
  const data = initializeDatabase();
  const settingsService = new SettingsService();
  const reviewService = new ReviewService(data.words);
  const statsService = new StatsService(data.words);
  const aiConfig = resolveAiConfig();
  const aiService = new AiService(
    [
      new GeminiProvider({
        apiKey: aiConfig.geminiApiKey,
        model: aiConfig.geminiModel,
      }),
      new OpenAiProvider({
        apiKey: aiConfig.openAiApiKey,
        model: aiConfig.openAiModel,
      }),
      new MockAiProvider(),
    ],
    settingsService,
    app.log,
    aiConfig.timeoutMs,
  );

  app.decorate("ctx", {
    data,
    aiService,
    reviewService,
    settingsService,
    statsService,
  });

  app.addHook("onClose", (instance, closeDone) => {
    instance.log.info("Closing database connection");
    data.db.close();
    closeDone();
  });

  done();
});
