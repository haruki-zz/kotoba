import type { FastifyServerOptions } from "fastify";

export type ServerMode = "ipc" | "http";

export type ApiServerOptions = {
  mode?: ServerMode;
  port?: number;
  host?: string;
  corsOrigins?: string[];
  authToken?: string;
  logger?: FastifyServerOptions["logger"];
  bodyLimit?: number;
};

export type NormalizedServerOptions = Required<
  Omit<ApiServerOptions, "authToken">
> & { authToken?: string };

const DEFAULT_BODY_LIMIT = 1_048_576; // 1MB
const DEFAULT_PORT = 3321;
const DEFAULT_HOST = "127.0.0.1";

export const normalizeServerOptions = (
  options: ApiServerOptions = {},
): NormalizedServerOptions => ({
  mode: options.mode ?? "ipc",
  port: options.port ?? DEFAULT_PORT,
  host: options.host ?? DEFAULT_HOST,
  corsOrigins: options.corsOrigins ?? [],
  authToken: options.authToken ?? process.env.API_AUTH_TOKEN ?? "dev-token",
  logger: options.logger ?? true,
  bodyLimit: options.bodyLimit ?? DEFAULT_BODY_LIMIT,
});
