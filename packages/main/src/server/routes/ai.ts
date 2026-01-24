import {
  aiGenerateWordRequestSchema,
  aiGenerateWordResponseSchema,
  aiProviderEnum,
} from "@kotoba/shared";
import fp from "fastify-plugin";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import type { AiService } from "../ai/service.js";
import { ApiServerOptions, type ServerMode } from "../config.js";
import { getRateLimitConfig } from "../plugins/rate-limit.js";
import { success } from "../response.js";

const aiGenerateResponseSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    provider: aiProviderEnum,
    output: aiGenerateWordResponseSchema,
    finishReason: z.string().optional(),
    model: z.string().optional(),
    latencyMs: z.number().int().nonnegative(),
  }),
});

export const aiRoutes = fp<ApiServerOptions>((app, opts, done) => {
  const mode: ServerMode = opts.mode ?? "ipc";
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    "/ai/generate-word",
    {
      schema: {
        body: aiGenerateWordRequestSchema,
        response: { 200: aiGenerateResponseSchema },
      },
      config: { rateLimit: getRateLimitConfig(mode, "ai") },
    },
    async (request) => {
      const payload = aiGenerateWordRequestSchema.parse(request.body);
      const aiService = app.ctx.aiService as AiService;
      const result = await aiService.generateWord(payload, {
        requestId: request.id,
      });
      return success(result);
    },
  );

  done();
});
