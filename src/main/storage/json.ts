import * as fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const JSON_SPACING = 2;

export const ensureDir = async (dir: string) => {
  await fs.mkdir(dir, { recursive: true });
};

export const readJsonFile = async <T>(filePath: string): Promise<T | null> => {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
};

export const writeJsonAtomic = async (filePath: string, payload: unknown) => {
  const dir = path.dirname(filePath);
  await ensureDir(dir);

  const tempPath = path.join(dir, `${path.basename(filePath)}.${crypto.randomUUID()}.tmp`);
  const content = `${JSON.stringify(payload, null, JSON_SPACING)}\n`;

  try {
    await fs.writeFile(tempPath, content, "utf-8");
    await fs.rename(tempPath, filePath);
  } catch (error) {
    await fs.rm(tempPath, { force: true });
    throw error;
  }
};
