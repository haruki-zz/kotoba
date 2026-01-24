import rateLimit from "@fastify/rate-limit";
import fp from "fastify-plugin";

import { ApiServerOptions, ServerMode } from "../config.js";

type RateLimitBucket = "read" | "write" | "ai";

const RATE_LIMITS: Record<ServerMode, Record<RateLimitBucket, number>> = {
  ipc: { read: 600, write: 120, ai: 30 },
  http: { read: 300, write: 60, ai: 15 },
};

export const getRateLimitConfig = (
  mode: ServerMode,
  bucket: RateLimitBucket,
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
