import { FastifyInstance } from 'fastify';

import { statsOverviewSchema } from '@shared/schemas';

import { AppContext } from '../context';

export const registerStatsRoutes = (app: FastifyInstance, ctx: AppContext) => {
  app.get(
    '/api/stats/overview',
    {
      schema: {
        response: {
          200: statsOverviewSchema,
        },
      },
    },
    async () => ctx.services.wordService.stats()
  );
};
