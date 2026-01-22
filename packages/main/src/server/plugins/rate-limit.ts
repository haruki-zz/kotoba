import rateLimit from "@fastify/rate-limit";
import fp from "fastify-plugin";

import { ApiServerOptions, ServerMode } from "../config.js";

const RATE_LIMITS: Record<ServerMode, { read: number; write: number }> = {
  ipc: { read: 600, write: 120 },
  http: { read: 300, write: 60 },
};

export const getRateLimitConfig = (
  mode: ServerMode,
  bucket: "read" | "write",
) => ({
  max: RATE_LIMITS[mode][bucket],
  timeWindow: "1 minute",
});

export const rateLimitPlugin = fp<ApiServerOptions>(async (app, opts) => {
  const mode = opts.mode ?? "ipc";
  await app.register(rateLimit, {
    global: false,
    keyGenerator: (request) => {
      if (mode === "http") {
        const token =
          request.headers.authorization?.replace("Bearer ", "") || "";
        return token || request.ip || request.id;
      }
      return "local-ipc";
    },
  });
});
