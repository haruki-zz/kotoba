import {
  wordCreateSchema,
  wordQuerySchema,
  wordRecordSchema,
  wordUpdateSchema,
} from "@kotoba/shared";
import fp from "fastify-plugin";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { ApiServerOptions, ServerMode } from "../config.js";
import { AppError } from "../errors.js";
import { getRateLimitConfig } from "../plugins/rate-limit.js";
import { success } from "../response.js";

const wordIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const wordQueryInputSchema = z.object({
  search: wordQuerySchema.shape.search,
  difficulty: wordQuerySchema.shape.difficulty,
  dueBefore: wordQuerySchema.shape.dueBefore,
  limit: z.coerce.number().int().positive().max(200).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

const successListResponseSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    items: z.array(wordRecordSchema),
    pagination: z.object({
      limit: z.number(),
      offset: z.number(),
      count: z.number(),
    }),
  }),
});

export const wordRoutes = fp<ApiServerOptions>((app, opts, done) => {
  const mode: ServerMode = opts.mode ?? "ipc";
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/words",
    {
      schema: {
        querystring: wordQueryInputSchema,
        response: { 200: successListResponseSchema },
      },
      config: { rateLimit: getRateLimitConfig(mode, "read") },
    },
    (request) => {
      const parsed = wordQuerySchema.parse(request.query);
      const items = app.ctx.data.words.list(parsed);
      return success({
        items,
        pagination: {
          limit: parsed.limit,
          offset: parsed.offset,
          count: items.length,
        },
      });
    },
  );

  server.post(
    "/words",
    {
      schema: {
        body: wordCreateSchema,
        response: { 201: z.object({ ok: z.literal(true), data: wordRecordSchema }) },
      },
      config: { rateLimit: getRateLimitConfig(mode, "write") },
    },
    (request, reply) => {
      const payload = request.body;
      const created = app.ctx.data.words.create(payload);
      reply.code(201);
      return success(created);
    },
  );

  server.get(
    "/words/:id",
    {
      schema: {
        params: wordIdParamSchema,
        response: { 200: z.object({ ok: z.literal(true), data: wordRecordSchema }) },
      },
      config: { rateLimit: getRateLimitConfig(mode, "read") },
    },
    (request) => {
      const params = request.params;
      const record = app.ctx.data.words.getById(params.id);
      if (!record) {
        throw new AppError("WORD_NOT_FOUND", "Word not found", 404);
      }
      return success(record);
    },
  );

  server.put(
    "/words/:id",
    {
      schema: {
        params: wordIdParamSchema,
        body: wordUpdateSchema,
        response: { 200: z.object({ ok: z.literal(true), data: wordRecordSchema }) },
      },
      config: { rateLimit: getRateLimitConfig(mode, "write") },
    },
    (request) => {
      const params = request.params;
      const updates = request.body;
      const updated = app.ctx.data.words.update(params.id, updates) ?? null;
      if (!updated) {
        throw new AppError("WORD_NOT_FOUND", "Word not found", 404);
      }
      return success(updated);
    },
  );

  server.delete(
    "/words/:id",
    {
      schema: {
        params: wordIdParamSchema,
        response: {
          200: z.object({
            ok: z.literal(true),
            data: z.object({ deleted: z.literal(true) }),
          }),
        },
      },
      config: { rateLimit: getRateLimitConfig(mode, "write") },
    },
    (request) => {
      const params = request.params;
      const existing = app.ctx.data.words.getById(params.id);
      if (!existing) {
        throw new AppError("WORD_NOT_FOUND", "Word not found", 404);
      }
      app.ctx.data.words.delete(params.id);
      return success({ deleted: true });
    },
  );

  done();
});
