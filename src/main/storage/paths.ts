import path from "node:path";

export const defaultDataDir = path.resolve(process.cwd(), "data");

export const getWordsPath = (baseDir = defaultDataDir) => path.join(baseDir, "words.json");

export const getActivityPath = (baseDir = defaultDataDir) => path.join(baseDir, "activity.json");

export const getProviderSettingsPath = (baseDir = defaultDataDir) =>
  path.join(baseDir, "provider-settings.json");
