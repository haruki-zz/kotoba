import {
  DEFAULT_REVIEW_BATCH_SIZE,
  reviewRequestSchema,
  reviewResultSchema,
  wordRecordSchema,
} from "@kotoba/shared";
import fp from "fastify-plugin";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { ApiServerOptions, ServerMode } from "../config.js";
import { getRateLimitConfig } from "../plugins/rate-limit.js";
import { success } from "../response.js";

const queueQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(200)
    .default(DEFAULT_REVIEW_BATCH_SIZE),
  dueBefore: z.string().datetime().optional(),
});

export const reviewRoutes = fp<ApiServerOptions>((app, opts, done) => {
  const mode: ServerMode = opts.mode ?? "ipc";
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/review/queue",
    {
      schema: {
        querystring: queueQuerySchema,
        response: {
          200: z.object({
            ok: z.literal(true),
            data: z.object({
              items: z.array(wordRecordSchema),
              pagination: z.object({
                limit: z.number(),
                count: z.number(),
              }),
            }),
          }),
        },
      },
      config: { rateLimit: getRateLimitConfig(mode, "read") },
    },
    (request) => {
      const { limit, dueBefore } = request.query;
      const items = app.ctx.reviewService.getQueue(limit, dueBefore);
      return success({
        items,
        pagination: {
          limit,
          count: items.length,
        },
      });
    },
  );

  server.post(
    "/review/submit",
    {
      schema: {
        body: reviewRequestSchema,
        response: {
          200: z.object({
            ok: z.literal(true),
            data: z.object({
              word: wordRecordSchema,
              result: reviewResultSchema,
            }),
          }),
        },
      },
      config: { rateLimit: getRateLimitConfig(mode, "write") },
    },
    (request) => {
      const { word, result } = app.ctx.reviewService.applyReview(request.body);
      return success({ word, result });
    },
  );

  server.post(
    "/review/undo",
    {
      schema: {
        response: {
          200: z.object({
            ok: z.literal(true),
            data: wordRecordSchema,
          }),
        },
      },
      config: { rateLimit: getRateLimitConfig(mode, "write") },
    },
    () => {
      const restored = app.ctx.reviewService.undoLast();
      return success(restored);
    },
  );

  done();
});
