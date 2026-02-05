const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryable = (error: unknown) => {
  if (!error) return false;
  const message = (error as Error).message ?? '';
  return /timeout|429|rate|overload|temporary|unavailable/i.test(message);
};

export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: { retries: number; delayMs: number }
): Promise<T> => {
  let attempt = 0;
  let lastError: unknown;
  while (attempt <= options.retries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === options.retries || !isRetryable(error)) {
        break;
      }
      await delay(options.delayMs * (attempt + 1));
      attempt += 1;
    }
  }
  throw lastError;
};
