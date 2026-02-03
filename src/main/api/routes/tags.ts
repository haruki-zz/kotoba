import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { tagCreateSchema, tagRecordSchema } from '@shared/schemas';

import { AppContext } from '../context';
import { NotFoundError } from '../errors';

const idParamsSchema = z.object({ id: z.coerce.number().int().positive() });

export const registerTagRoutes = (app: FastifyInstance, ctx: AppContext) => {
  app.get(
    '/api/tags',
    {
      schema: {
        response: {
          200: z.array(tagRecordSchema),
        },
      },
    },
    async () => ctx.services.tagService.list()
  );

  app.get(
    '/api/tags/:id',
    {
      schema: {
        params: idParamsSchema,
        response: {
          200: tagRecordSchema,
        },
      },
    },
    async (request) => {
      const tag = ctx.services.tagService.get(request.params.id);
      if (!tag) throw new NotFoundError('Tag not found');
      return tag;
    }
  );

  app.post(
    '/api/tags',
    {
      schema: {
        body: tagCreateSchema,
        response: {
          200: tagRecordSchema,
        },
      },
    },
    async (request) => ctx.services.tagService.upsert(request.body)
  );
};
