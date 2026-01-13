import { ProviderName, ProviderSettings, ProviderState } from "../../shared/ai";
import { buildAiProvider } from "../ai";
import { AiProvider, ProviderConfig } from "../ai/types";
import { DEFAULT_TIMEOUT_MS } from "../ai/utils";
import { createKeychainStore, SecretStore } from "../security/secret-store";
import {
  createFileProviderSettingsStore,
  ProviderSettingsStore,
  StoredProviderSettings,
} from "../settings/provider-settings";

const resolveEnvApiKey = (provider: ProviderName) => {
  if (provider === "openai") {
    return process.env.OPENAI_API_KEY?.trim() || undefined;
  }

  if (provider === "gemini") {
    return process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim() || undefined;
  }

  return undefined;
};

const normalizeProvider = (provider?: ProviderName): ProviderName => provider ?? "mock";

const normalizeApiKey = (value?: string) => value?.trim() || undefined;

const pickTimeout = (next?: number, current?: number) => next ?? current ?? DEFAULT_TIMEOUT_MS;

const resolveStoredApiKey = async (provider: ProviderName, secretStore: SecretStore) => {
  const secret = await secretStore.getSecret(provider);
  return normalizeApiKey(secret);
};

const resolveApiKey = async (
  provider: ProviderName,
  secretStore: SecretStore,
  candidate?: string,
): Promise<string | undefined> => {
  const normalized = normalizeApiKey(candidate);
  if (normalized) {
    return normalized;
  }

  const stored = await resolveStoredApiKey(provider, secretStore);
  if (stored) {
    return stored;
  }

  return resolveEnvApiKey(provider);
};

export interface ProviderManager {
  getProvider: () => Promise<AiProvider>;
  getState: () => Promise<ProviderState>;
  setConfig: (settings: ProviderSettings) => Promise<ProviderState>;
}

interface ProviderManagerOptions {
  initialSettings?: ProviderSettings;
  providerFactory?: (config: ProviderConfig) => AiProvider;
  secretStore?: SecretStore;
  settingsStore?: ProviderSettingsStore;
}

export const createProviderManager = async ({
  initialSettings = {},
  providerFactory = buildAiProvider,
  secretStore = createKeychainStore(),
  settingsStore = createFileProviderSettingsStore(),
}: ProviderManagerOptions = {}): Promise<ProviderManager> => {
  const persisted: StoredProviderSettings = await settingsStore.load();
  let provider = normalizeProvider(initialSettings.provider ?? persisted.provider);
  let timeoutMs = pickTimeout(initialSettings.timeoutMs, persisted.timeoutMs);
  let apiKey = await resolveApiKey(provider, secretStore, initialSettings.apiKey);
  let cachedProvider: AiProvider | undefined;

  const getState = async (): Promise<ProviderState> => ({
    provider,
    hasApiKey: Boolean(apiKey ?? resolveEnvApiKey(provider)),
    timeoutMs,
  });

  const setConfig = async (settings: ProviderSettings): Promise<ProviderState> => {
    const nextProvider = normalizeProvider(settings.provider ?? provider);
    const nextTimeout = pickTimeout(settings.timeoutMs, timeoutMs);
    const providedKey = normalizeApiKey(settings.apiKey);
    let nextApiKey = apiKey;

    if (settings.apiKey !== undefined) {
      nextApiKey = providedKey;
      if (providedKey) {
        await secretStore.setSecret(nextProvider, providedKey);
      } else {
        await secretStore.deleteSecret(nextProvider);
      }
    } else if (nextProvider !== provider) {
      nextApiKey = await resolveStoredApiKey(nextProvider, secretStore);
    }

    if (!nextApiKey) {
      nextApiKey = resolveEnvApiKey(nextProvider);
    }

    if (nextProvider !== "mock" && !nextApiKey) {
      throw new Error(`${nextProvider} provider 需要有效的 API 密钥`);
    }

    provider = nextProvider;
    timeoutMs = nextTimeout;
    apiKey = nextApiKey;
    cachedProvider = undefined;

    await settingsStore.save({ provider, timeoutMs });

    return getState();
  };

  const getProvider = async () => {
    if (!cachedProvider) {
      const resolvedKey = apiKey ?? resolveEnvApiKey(provider);

      if (provider !== "mock" && !resolvedKey) {
        throw new Error(`${provider} provider 需要有效的 API 密钥`);
      }

      cachedProvider = providerFactory({
        provider,
        apiKey: resolvedKey,
        timeoutMs,
      });
    }

    return cachedProvider;
  };

  return { getProvider, getState, setConfig };
};
