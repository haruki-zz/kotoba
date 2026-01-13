import keytar from "keytar";
import { ProviderName } from "../../shared/ai";

export interface SecretStore {
  getSecret: (provider: ProviderName) => Promise<string | undefined>;
  setSecret: (provider: ProviderName, secret: string) => Promise<void>;
  deleteSecret: (provider: ProviderName) => Promise<void>;
}

const normalizeSecret = (value?: string) => value?.trim() || undefined;

export const createKeychainStore = (service = "kotoba-ai-provider"): SecretStore => ({
  getSecret: async (provider) => {
    const secret = await keytar.getPassword(service, provider);
    return normalizeSecret(secret ?? undefined);
  },
  setSecret: async (provider, secret) => {
    const normalized = normalizeSecret(secret);
    if (!normalized) {
      await keytar.deletePassword(service, provider);
      return;
    }
    await keytar.setPassword(service, provider, normalized);
  },
  deleteSecret: async (provider) => {
    await keytar.deletePassword(service, provider);
  },
});

export const createMemorySecretStore = (
  initial?: Partial<Record<ProviderName, string>>,
): SecretStore => {
  const secrets = new Map<ProviderName, string>();

  Object.entries(initial ?? {}).forEach(([provider, secret]) => {
    const normalized = normalizeSecret(secret);
    if (normalized) {
      secrets.set(provider as ProviderName, normalized);
    }
  });

  return {
    getSecret: async (provider) => secrets.get(provider),
    setSecret: async (provider, secret) => {
      const normalized = normalizeSecret(secret);
      if (normalized) {
        secrets.set(provider, normalized);
      } else {
        secrets.delete(provider);
      }
    },
    deleteSecret: async (provider) => {
      secrets.delete(provider);
    },
  };
};
