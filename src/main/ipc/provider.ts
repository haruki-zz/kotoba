import { ProviderName, ProviderSettings, ProviderState } from "../../shared/ai";
import { buildAiProvider } from "../ai";
import { AiProvider, ProviderConfig } from "../ai/types";
import { DEFAULT_TIMEOUT_MS } from "../ai/utils";

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

const resolveApiKey = (provider: ProviderName, candidate?: string) =>
  normalizeApiKey(candidate) ?? resolveEnvApiKey(provider);

const normalizeConfig = (current: ProviderConfig, update: ProviderSettings): ProviderConfig => {
  const provider = normalizeProvider(update.provider ?? current.provider);
  const apiKey = resolveApiKey(provider, update.apiKey ?? current.apiKey);
  const timeoutMs = update.timeoutMs ?? current.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return { provider, apiKey, timeoutMs, fetch: current.fetch };
};

export interface ProviderManager {
  getProvider: () => AiProvider;
  getState: () => ProviderState;
  setConfig: (settings: ProviderSettings) => ProviderState;
}

export const createProviderManager = (
  initialSettings: ProviderSettings = {},
  providerFactory = buildAiProvider,
): ProviderManager => {
  let config: ProviderConfig = normalizeConfig(
    { provider: "mock", apiKey: resolveEnvApiKey("mock"), timeoutMs: DEFAULT_TIMEOUT_MS },
    initialSettings,
  );
  let cachedProvider: AiProvider | undefined;

  const getState = (): ProviderState => {
    const provider = normalizeProvider(config.provider);
    const apiKey = resolveApiKey(provider, config.apiKey);

    return {
      provider,
      hasApiKey: Boolean(apiKey),
      timeoutMs: config.timeoutMs,
    };
  };

  const setConfig = (settings: ProviderSettings): ProviderState => {
    const next = normalizeConfig(config, settings);
    const provider = normalizeProvider(next.provider);
    const apiKey = resolveApiKey(provider, next.apiKey);

    if (provider !== "mock" && !apiKey) {
      throw new Error(`${provider} provider 需要有效的 API 密钥`);
    }

    config = { ...next, provider, apiKey };
    cachedProvider = undefined;

    return getState();
  };

  const getProvider = () => {
    if (!cachedProvider) {
      const provider = normalizeProvider(config.provider);
      const apiKey = resolveApiKey(provider, config.apiKey);
      cachedProvider = providerFactory({ ...config, provider, apiKey });
    }

    return cachedProvider;
  };

  return { getProvider, getState, setConfig };
};
