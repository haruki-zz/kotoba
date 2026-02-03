import { startServer } from './api/server';

export async function bootstrapMain(options?: { dbPath?: string; port?: number; host?: string }) {
  const { app } = await startServer(options);
  return app;
}

const entryHref = process.argv[1] ? new URL(process.argv[1], 'file://').href : '';
const isDirectRun = import.meta.url === entryHref;

if (isDirectRun) {
  startServer()
    .then(({ app }) => {
      const address = app.server.address();
      // eslint-disable-next-line no-console
      console.log('[kotoba] Fastify API listening on', address);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('[kotoba] Failed to start API server', error);
      process.exit(1);
    });
}

export * from './db';
export * from './api/server';
