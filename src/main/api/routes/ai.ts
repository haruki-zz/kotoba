import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { aiGenerateRequestSchema, aiGenerateResponseSchema } from '@shared/schemas';

import { AppContext } from '../context';

export const registerAiRoutes = (app: FastifyInstance, ctx: AppContext) => {
  app.get(
    '/api/ai/providers',
    {
      schema: {
        response: {
          200: z.object({ items: z.array(z.string()) }),
        },
      },
    },
    async () => ({ items: ctx.providers.aiRegistry.available() })
  );

  app.post(
    '/api/ai/generate',
    {
      schema: {
        body: aiGenerateRequestSchema,
        response: {
          200: aiGenerateResponseSchema,
        },
      },
    },
    async (request) => {
      return ctx.services.aiService.generate(request.body);
    }
  );
};
