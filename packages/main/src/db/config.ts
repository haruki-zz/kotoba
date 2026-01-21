import fs from "node:fs";
import path from "node:path";

export type DatabaseConfig = {
  path: string;
};

const DEFAULT_DB_FILENAME = "kotoba.sqlite";

const ensureDirectory = (targetPath: string) => {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
};

export const resolveDatabasePath = (customPath?: string) => {
  if (customPath) {
    const normalized = path.isAbsolute(customPath)
      ? customPath
      : path.resolve(process.cwd(), customPath);
    ensureDirectory(normalized);
    return normalized;
  }

  const fallback = path.resolve(process.cwd(), "data", DEFAULT_DB_FILENAME);
  ensureDirectory(fallback);
  return fallback;
};

export const loadDatabaseConfig = (): DatabaseConfig => {
  return {
    path: resolveDatabasePath(process.env.DATABASE_PATH),
  };
};
