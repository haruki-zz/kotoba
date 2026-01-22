import fp from "fastify-plugin";

import { type DataAccessLayer, initializeDatabase } from "../../db/setup.js";
import { ReviewService } from "../services/review-service.js";
import { SettingsService } from "../services/settings-service.js";
import { StatsService } from "../services/stats-service.js";

export type AppContext = {
  data: DataAccessLayer;
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

  app.decorate("ctx", {
    data,
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
