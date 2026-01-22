import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";

import {
  ApiServerOptions,
  type NormalizedServerOptions,
  normalizeServerOptions,
} from "./config.js";
import { contextPlugin } from "./plugins/context.js";
import { errorHandlerPlugin } from "./plugins/error-handler.js";
import { rateLimitPlugin } from "./plugins/rate-limit.js";
import { securityPlugin } from "./plugins/security.js";
import { registerApiRoutes } from "./routes/index.js";

export type ApiServer = Awaited<ReturnType<typeof buildApiServer>>;

export const buildApiServer = async (options: ApiServerOptions = {}) => {
  const resolved: NormalizedServerOptions = normalizeServerOptions(options);
  const app = Fastify({
    logger: resolved.logger,
    bodyLimit: resolved.bodyLimit,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(contextPlugin);
  await app.register(securityPlugin, resolved);
  await app.register(rateLimitPlugin, resolved);
  await app.register(registerApiRoutes, resolved);
  await app.register(errorHandlerPlugin);

  await app.ready();
  return app;
};

export const startHttpServer = async (options: ApiServerOptions = {}) => {
  const app = await buildApiServer({
    ...options,
    mode: options.mode ?? "http",
  });
  const resolved = normalizeServerOptions({ ...options, mode: "http" });
  await app.listen({ port: resolved.port, host: resolved.host });
  app.log.info(
    { port: resolved.port, host: resolved.host, mode: resolved.mode },
    "API server is listening",
  );
  return app;
};
