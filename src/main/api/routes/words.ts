import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import {
  bulkImportSchema,
  importValidationRequestSchema,
  importValidationResponseSchema,
  reviewQueueQuerySchema,
  reviewRequestSchema,
  wordBatchRequestSchema,
  wordBatchResponseSchema,
  wordCreateWithMetaSchema,
  wordDeleteQuerySchema,
  wordExportQuerySchema,
  wordExportResponseSchema,
  wordListQuerySchema,
  wordListResponseSchema,
  wordUpdateWithMetaSchema,
  wordViewSchema,
} from '@shared/schemas';

import { AppContext } from '../context';
import { NotFoundError } from '../errors';

const idParamsSchema = z.object({ id: z.coerce.number().int().positive() });

export const registerWordRoutes = (app: FastifyInstance, ctx: AppContext) => {
  app.post(
    '/api/words',
    {
      schema: {
        body: wordCreateWithMetaSchema,
        response: {
          201: wordViewSchema,
        },
      },
    },
    async (request, reply) => {
      const created = ctx.services.wordService.create(request.body);
      reply.code(201);
      return created;
    }
  );

  app.get(
    '/api/words',
    {
      schema: {
        querystring: wordListQuerySchema,
        response: {
          200: wordListResponseSchema,
        },
      },
    },
    async (request) => {
      const result = ctx.services.wordService.list(request.query);
      return {
        items: result.items,
        page: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          hasMore: result.offset + result.limit < result.total,
        },
      };
    }
  );

  app.get(
    '/api/words/:id',
    {
      schema: {
        params: idParamsSchema,
        response: {
          200: wordViewSchema,
        },
      },
    },
    async (request) => {
      const word = ctx.services.wordService.getById(request.params.id);
      if (!word) throw new NotFoundError('Word not found');
      return word;
    }
  );

  app.patch(
    '/api/words/:id',
    {
      schema: {
        params: idParamsSchema,
        body: wordUpdateWithMetaSchema,
        response: {
          200: wordViewSchema,
        },
      },
    },
    async (request) => {
      const updated = ctx.services.wordService.update(request.params.id, request.body);
      if (!updated) throw new NotFoundError('Word not found');
      return updated;
    }
  );

  app.delete(
    '/api/words/:id',
    {
      schema: {
        params: idParamsSchema,
        querystring: wordDeleteQuerySchema,
        response: {
          200: z.object({
            deleted: z.boolean(),
            mode: z.enum(['soft', 'hard']),
          }),
        },
      },
    },
    async (request) => {
      const removed = ctx.services.wordService.delete(request.params.id, request.query);
      if (!removed) throw new NotFoundError('Word not found');
      return { deleted: true, mode: request.query.hard ? 'hard' : 'soft' };
    }
  );

  app.post(
    '/api/words/:id/restore',
    {
      schema: {
        params: idParamsSchema,
        response: {
          200: wordViewSchema,
        },
      },
    },
    async (request) => {
      const restored = ctx.services.wordService.restore(request.params.id);
      if (!restored) throw new NotFoundError('Word not found');
      return restored;
    }
  );

  app.post(
    '/api/words/:id/review',
    {
      schema: {
        params: idParamsSchema,
        body: reviewRequestSchema,
        response: {
          200: wordViewSchema,
        },
      },
    },
    async (request) => {
      const reviewed = ctx.services.wordService.review(request.params.id, request.body);
      if (!reviewed) throw new NotFoundError('Word not found');
      return reviewed;
    }
  );

  app.post(
    '/api/words/bulk',
    {
      schema: {
        body: bulkImportSchema,
        response: {
          201: z.object({ items: z.array(wordViewSchema), count: z.number().int().nonnegative() }),
        },
      },
    },
    async (request, reply) => {
      const items = ctx.services.wordService.bulkImport(request.body);
      reply.code(201);
      return { items, count: items.length };
    }
  );

  app.post(
    '/api/words/import/validate',
    {
      schema: {
        body: importValidationRequestSchema,
        response: {
          200: importValidationResponseSchema,
        },
      },
    },
    async (request) => ctx.services.wordService.validateImport(request.body)
  );

  app.get(
    '/api/words/export',
    {
      schema: {
        querystring: wordExportQuerySchema,
        response: {
          200: wordExportResponseSchema,
        },
      },
    },
    async (request) => ctx.services.wordService.exportWords(request.query)
  );

  app.post(
    '/api/words/batch',
    {
      schema: {
        body: wordBatchRequestSchema,
        response: {
          200: wordBatchResponseSchema,
        },
      },
    },
    async (request) => ctx.services.wordService.batchOperate(request.body)
  );

  app.get(
    '/api/review/queue',
    {
      schema: {
        querystring: reviewQueueQuerySchema,
        response: {
          200: z.object({ items: z.array(wordViewSchema) }),
        },
      },
    },
    async (request) => {
      const items = ctx.services.wordService.queue(request.query);
      return { items };
    }
  );
};
