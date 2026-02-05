import { AiProviderName } from '@shared/types';

import { RateLimiter } from './rate-limiter';
import { AiProvider } from './types';

type ProviderMap = Record<AiProviderName, AiProvider>;

export class ProviderRegistry {
  private limiter: RateLimiter;

  constructor(
    private providers: ProviderMap,
    private defaultProvider: AiProviderName,
    maxConcurrent = 3
  ) {
    this.limiter = new RateLimiter(maxConcurrent);
  }

  get(name?: AiProviderName): AiProvider {
    const resolved = name && this.providers[name] ? name : this.defaultProvider;
    const provider = this.providers[resolved];
    if (!provider) {
      throw new Error(`Provider ${resolved} not registered`);
    }
    return provider;
  }

  available(): AiProviderName[] {
    return Object.keys(this.providers) as AiProviderName[];
  }

  async run<T>(provider: AiProvider, task: () => Promise<T>) {
    return this.limiter.run(task);
  }
}
