import { mkdirSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_DB_FILENAME = 'kotoba.sqlite';

export const resolveDatabasePath = (filename?: string): string => {
  if (filename === ':memory:') return filename;
  if (filename) return path.resolve(filename);
  return path.resolve(process.cwd(), 'data', DEFAULT_DB_FILENAME);
};

export const ensureDirectory = (filepath: string) => {
  if (filepath === ':memory:') return;
  const dir = path.dirname(filepath);
  mkdirSync(dir, { recursive: true });
};
