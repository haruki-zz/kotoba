export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

type RequestOptions = RequestInit & {
  searchParams?: Record<string, string | number | undefined>;
};

const readEnvString = (key: string) => {
  const env = (import.meta as { env?: Record<string, unknown> }).env;
  const value = env?.[key];
  return typeof value === "string" ? value : undefined;
};

const baseFromEnv = readEnvString("VITE_API_BASE");
const tokenFromEnv =
  readEnvString("VITE_API_TOKEN") ?? readEnvString("VITE_API_AUTH_TOKEN");

const defaultBaseUrl = baseFromEnv ?? "http://localhost:4000/api/v1";
const defaultAuthToken = tokenFromEnv ?? "dev-token";

const buildUrl = (
  path: string,
  searchParams?: Record<string, string | number | undefined>,
) => {
  const url = new URL(path, defaultBaseUrl);
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
};

const parseResponse = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return (await response.json()) as unknown;
  }
  return await response.text();
};

const request = async <T>(path: string, options?: RequestOptions) => {
  const { searchParams, headers, ...rest } = options ?? {};
  const url = buildUrl(path, searchParams);
  const response = await fetch(url, {
    ...rest,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${defaultAuthToken}`,
      ...headers,
    },
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "message" in payload
        ? String((payload as { message: string }).message)
        : `请求失败 (${response.status})`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
};

const get = async <T>(path: string, options?: RequestOptions) =>
  request<T>(path, { ...options, method: "GET" });

const post = async <T, TBody = unknown>(
  path: string,
  body: TBody,
  options?: RequestOptions,
) =>
  request<T>(path, { ...options, method: "POST", body: JSON.stringify(body) });

const patch = async <T, TBody = unknown>(
  path: string,
  body: TBody,
  options?: RequestOptions,
) =>
  request<T>(path, { ...options, method: "PATCH", body: JSON.stringify(body) });

const del = async <T>(path: string, options?: RequestOptions) =>
  request<T>(path, { ...options, method: "DELETE" });

export const apiClient = { request, get, post, patch, del };
