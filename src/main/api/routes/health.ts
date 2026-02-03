import { FastifyInstance } from 'fastify';

export const registerHealthRoute = (app: FastifyInstance) => {
  app.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
};
