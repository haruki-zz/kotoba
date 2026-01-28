import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fastify from 'fastify';
import { wordSchema } from '@kotoba/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

config({ path: path.join(repoRoot, '.env.local'), override: true });
config({ path: path.join(repoRoot, '.env') });

const server = fastify({ logger: true });

server.get('/health', async () => ({ status: 'ok' }));

server.get('/sample-word', async () => {
  const example = wordSchema.parse({
    word: 'arigatou',
    reading: 'arigatou',
    contextExpl: 'Casual thanks used with friends.',
    sceneDesc: 'You thank a barista after getting coffee.',
    example: 'Arigatou for the coffee!',
    difficulty: 'medium',
    ef: 2.5,
    intervalDays: 0,
    repetition: 0,
  });

  return { example };
});

const port = Number(process.env.API_PORT ?? 3030);

server
  .listen({ port, host: '0.0.0.0' })
  .then(() => {
    server.log.info(`API ready on http://localhost:${port}`);
  })
  .catch((error: unknown) => {
    server.log.error(error);
    process.exit(1);
  });
