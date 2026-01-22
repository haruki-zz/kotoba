import cors from "@fastify/cors";
import fp from "fastify-plugin";

import { ApiServerOptions } from "../config.js";
import { AppError } from "../errors.js";

export const securityPlugin = fp<ApiServerOptions>(async (app, opts) => {
  const mode = opts.mode ?? "ipc";
  const authToken = opts.authToken;

  if (mode === "http") {
    const allowedOrigins =
      opts.corsOrigins && opts.corsOrigins.length
        ? opts.corsOrigins
        : ["http://localhost:5173"];

    await app.register(cors, {
      origin: allowedOrigins,
      credentials: false,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["content-type", "authorization", "x-request-id"],
    });

    app.addHook("onRequest", (request) => {
      if (request.url === "/healthz") {
        return;
      }
      if (!authToken) {
        throw new AppError(
          "AUTH_TOKEN_REQUIRED",
          "API auth token is not configured",
          500,
        );
      }
      const header = request.headers.authorization;
      const provided = header?.startsWith("Bearer ")
        ? header.replace("Bearer ", "")
        : null;
      if (!provided || provided !== authToken) {
        throw new AppError(
          "AUTH_INVALID_TOKEN",
          "Unauthorized",
          401,
        );
      }
    });
  }
});
