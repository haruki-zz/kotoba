import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { aiGenerateRequestSchema, aiGenerateResponseSchema } from '@shared/schemas';

import { AppContext } from '../context';
import { BadRequestError } from '../errors';

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
      const settings = ctx.services.settingsService.getSnapshot().settings;
      const provider = request.body.provider ?? settings.ai.defaultProvider;

      if (!settings.privacy.allowNetwork && provider !== 'mock') {
        throw new BadRequestError(
          'Network access is disabled by privacy settings. Use mock provider or enable network access.'
        );
      }

      return ctx.services.aiService.generate({ ...request.body, provider });
    }
  );
};
