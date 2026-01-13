import { ProviderName } from "../../shared/ai";
import { readJsonFile, writeJsonAtomic } from "../storage/json";
import { defaultDataDir, getProviderSettingsPath } from "../storage/paths";

export interface StoredProviderSettings {
  provider?: ProviderName;
  timeoutMs?: number;
}

export interface ProviderSettingsStore {
  load: () => Promise<StoredProviderSettings>;
  save: (settings: StoredProviderSettings) => Promise<void>;
}

export const createFileProviderSettingsStore = (
  baseDir = defaultDataDir,
): ProviderSettingsStore => {
  const settingsPath = getProviderSettingsPath(baseDir);

  const load = async () => (await readJsonFile<StoredProviderSettings>(settingsPath)) ?? {};

  const save = async (settings: StoredProviderSettings) => {
    await writeJsonAtomic(settingsPath, settings);
  };

  return { load, save };
};

export const createMemoryProviderSettingsStore = (
  initial?: StoredProviderSettings,
): ProviderSettingsStore => {
  let current = initial ?? {};

  return {
    load: async () => current,
    save: async (settings) => {
      current = settings;
    },
  };
};
