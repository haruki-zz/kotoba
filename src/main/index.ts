// Main process placeholder. Fastify API + Electron shell will be implemented in later plans.
export function bootstrapMain() {
  // Intentionally left minimal for plan_01; future steps will wire Fastify + Electron.
  return 'kotoba-main-ready';
}

const entryHref = process.argv[1] ? new URL(process.argv[1], 'file://').href : '';
const isDirectRun = import.meta.url === entryHref;

if (isDirectRun) {
  // eslint-disable-next-line no-console
  console.log('[kotoba] Base environment initialized');
}

export * from './db';
