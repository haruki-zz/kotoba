import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { tagCreateSchema, tagRecordSchema, tagUpdateSchema } from '@shared/schemas';

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

  app.patch(
    '/api/tags/:id',
    {
      schema: {
        params: idParamsSchema,
        body: tagUpdateSchema,
        response: {
          200: tagRecordSchema,
        },
      },
    },
    async (request) => {
      const updated = ctx.services.tagService.update(request.params.id, request.body);
      if (!updated) throw new NotFoundError('Tag not found');
      return updated;
    }
  );

  app.delete(
    '/api/tags/:id',
    {
      schema: {
        params: idParamsSchema,
        response: {
          200: z.object({ deleted: z.boolean() }),
        },
      },
    },
    async (request) => {
      const deleted = ctx.services.tagService.delete(request.params.id);
      if (!deleted) throw new NotFoundError('Tag not found');
      return { deleted: true };
    }
  );
};
