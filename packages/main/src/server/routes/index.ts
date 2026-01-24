import fp from "fastify-plugin";

import { ApiServerOptions, ServerMode } from "../config.js";
import { aiRoutes } from "./ai.js";
import { healthRoutes } from "./health.js";
import { reviewRoutes } from "./review.js";
import { settingsRoutes } from "./settings.js";
import { statsRoutes } from "./stats.js";
import { wordRoutes } from "./words.js";

const apiPrefix = "/api/v1";

export const registerApiRoutes = fp<ApiServerOptions>(async (app, opts) => {
  const mode: ServerMode = opts.mode ?? "ipc";

  await app.register(healthRoutes);
  await app.register(aiRoutes, { prefix: apiPrefix, mode });
  await app.register(wordRoutes, { prefix: apiPrefix, mode });
  await app.register(reviewRoutes, { prefix: apiPrefix, mode });
  await app.register(statsRoutes, { prefix: apiPrefix, mode });
  await app.register(settingsRoutes, { prefix: apiPrefix, mode });
});
