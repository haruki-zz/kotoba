import cors from '@fastify/cors';
import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import { ZodError } from 'zod';

import { AppContext, createAppContext } from './context';
import { BadRequestError, HttpError, toErrorResponse } from './errors';
import { registerAiRoutes } from './routes/ai';
import { registerHealthRoute } from './routes/health';
import { registerSettingsRoutes } from './routes/settings';
import { registerSourceRoutes } from './routes/sources';
import { registerStatsRoutes } from './routes/stats';
import { registerTagRoutes } from './routes/tags';
import { registerWordRoutes } from './routes/words';

const DEFAULT_PORT = Number(process.env.API_PORT ?? 8787);
const DEFAULT_HOST = process.env.API_HOST ?? '127.0.0.1';

export const buildServer = (ctx: AppContext) => {
  const logger = process.env.NODE_ENV === 'test' ? false : { level: 'info' as const };
  const app = Fastify({ logger }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.register(cors, {
    origin:
      process.env.CORS_ORIGIN?.split(',').map((item) => item.trim()).filter(Boolean) ??
      ['http://localhost:5173', 'http://127.0.0.1:5173'],
  });

  app.addHook('onResponse', (request, reply, done) => {
    request.log.info(
      { statusCode: reply.statusCode, responseTime: reply.getResponseTime() },
      `${request.method} ${request.url}`
    );
    done();
  });

  app.addHook('onClose', (_, done) => {
    ctx.close();
    done();
  });

  registerHealthRoute(app);
  registerAiRoutes(app, ctx);
  registerWordRoutes(app, ctx);
  registerTagRoutes(app, ctx);
  registerSourceRoutes(app, ctx);
  registerStatsRoutes(app, ctx);
  registerSettingsRoutes(app, ctx);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof HttpError) {
      request.log.warn({ err: error }, 'handled error');
      return reply.status(error.statusCode).send(toErrorResponse(error));
    }

    if (error instanceof ZodError) {
      const badRequest = new BadRequestError('Invalid request', error.errors);
      request.log.warn({ err: badRequest }, 'validation error');
      return reply.status(badRequest.statusCode).send(toErrorResponse(badRequest));
    }

    request.log.error({ err: error }, 'unhandled error');
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
    return reply.status(statusCode).send({
      statusCode,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Unexpected error',
    });
  });

  return app;
};

export const startServer = async (options?: { port?: number; host?: string; dbPath?: string }) => {
  const ctx = createAppContext(options?.dbPath);
  const app = buildServer(ctx);
  const port = options?.port ?? DEFAULT_PORT;
  const host = options?.host ?? DEFAULT_HOST;
  await app.listen({ port, host });
  return { app, ctx };
};
