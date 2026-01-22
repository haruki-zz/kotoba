import { startHttpServer } from "./app.js";
import { ApiServerOptions, ServerMode } from "./config.js";

const parseOrigins = (raw?: string) =>
  raw
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

const mode = (process.env.API_MODE as ServerMode) ?? "http";
const options: ApiServerOptions = {
  mode,
  port: process.env.API_PORT ? Number(process.env.API_PORT) : undefined,
  host: process.env.API_HOST,
  corsOrigins: parseOrigins(process.env.API_CORS_ORIGINS),
  authToken: process.env.API_AUTH_TOKEN,
};

startHttpServer(options).catch((error) => {
  console.error("Failed to start API server", error);
  process.exit(1);
});
