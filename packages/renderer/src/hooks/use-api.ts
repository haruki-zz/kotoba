import { useCallback } from "react";
import { toast } from "sonner";

import { apiClient, ApiError } from "../lib/api-client.js";

export const useApi = () => {
  const withErrorToast = useCallback(
    async <T>(action: () => Promise<T>, context?: string) => {
      try {
        return await action();
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : (context ?? "发生未知错误，请稍后再试");
        toast.error(message);
        throw error;
      }
    },
    [],
  );

  return { api: apiClient, withErrorToast };
};
