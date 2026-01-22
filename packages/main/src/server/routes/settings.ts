import { appSettingsSchema } from "@kotoba/shared";
import fp from "fastify-plugin";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { ApiServerOptions, ServerMode } from "../config.js";
import { getRateLimitConfig } from "../plugins/rate-limit.js";
import { success } from "../response.js";

const settingsUpdateSchema = appSettingsSchema.partial();

export const settingsRoutes = fp<ApiServerOptions>((app, opts, done) => {
  const mode: ServerMode = opts.mode ?? "ipc";
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/settings",
    {
      schema: {
        response: {
          200: z.object({
            ok: z.literal(true),
            data: appSettingsSchema,
          }),
        },
      },
      config: { rateLimit: getRateLimitConfig(mode, "read") },
    },
    () => success(app.ctx.settingsService.getSettings()),
  );

  server.put(
    "/settings",
    {
      schema: {
        body: settingsUpdateSchema,
        response: {
          200: z.object({
            ok: z.literal(true),
            data: appSettingsSchema,
          }),
        },
      },
      config: { rateLimit: getRateLimitConfig(mode, "write") },
    },
    (request) => {
      const updated = app.ctx.settingsService.updateSettings(request.body);
      return success(updated);
    },
  );

  done();
});
