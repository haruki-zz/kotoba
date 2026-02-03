import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { sourceCreateSchema, sourceRecordSchema } from '@shared/schemas';

import { AppContext } from '../context';
import { NotFoundError } from '../errors';

const idParamsSchema = z.object({ id: z.coerce.number().int().positive() });

export const registerSourceRoutes = (app: FastifyInstance, ctx: AppContext) => {
  app.get(
    '/api/sources',
    {
      schema: {
        response: {
          200: z.array(sourceRecordSchema),
        },
      },
    },
    async () => ctx.services.sourceService.list()
  );

  app.get(
    '/api/sources/:id',
    {
      schema: {
        params: idParamsSchema,
        response: {
          200: sourceRecordSchema,
        },
      },
    },
    async (request) => {
      const source = ctx.services.sourceService.get(request.params.id);
      if (!source) throw new NotFoundError('Source not found');
      return source;
    }
  );

  app.post(
    '/api/sources',
    {
      schema: {
        body: sourceCreateSchema,
        response: {
          200: sourceRecordSchema,
        },
      },
    },
    async (request) => ctx.services.sourceService.upsert(request.body)
  );
};
