import { wordRecordSchema } from "@kotoba/shared";
import fp from "fastify-plugin";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { ApiServerOptions, ServerMode } from "../config.js";
import { getRateLimitConfig } from "../plugins/rate-limit.js";
import { success } from "../response.js";

const statsResponseSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    totalWords: z.number(),
    difficultyDistribution: z.object({
      easy: z.number(),
      medium: z.number(),
      hard: z.number(),
    }),
    dueCount: z.number(),
    overdueCount: z.number(),
    todayNew: z.number(),
    thisWeekNew: z.number(),
    hardSamples: z.array(wordRecordSchema),
  }),
});

export const statsRoutes = fp<ApiServerOptions>((app, opts, done) => {
  const mode: ServerMode = opts.mode ?? "ipc";
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/stats/summary",
    {
      schema: {
        response: {
          200: statsResponseSchema,
        },
      },
      config: { rateLimit: getRateLimitConfig(mode, "read") },
    },
    () => {
      const summary = app.ctx.statsService.getSummary();
      return success(summary);
    },
  );

  done();
});
