import { FastifyError } from "fastify";
import fp from "fastify-plugin";
import { ZodError } from "zod";

import {
  AppError,
  fromFastifyError,
  fromZodError,
  isAppError,
  toErrorResponse,
} from "../errors.js";

export const errorHandlerPlugin = fp((app, _opts, done) => {
  app.setErrorHandler((error, request, reply) => {
    if (isAppError(error)) {
      reply
        .status(error.statusCode)
        .send(toErrorResponse(error, request.id));
      return;
    }

    if (error instanceof ZodError) {
      const mapped = fromZodError(
        error,
        request.method === "GET" ? "query" : "body",
      );
      reply.status(mapped.statusCode).send(toErrorResponse(mapped, request.id));
      return;
    }

    const fastifyError = error as FastifyError;
    if (fastifyError.validation || typeof fastifyError.statusCode === "number") {
      const mapped = fromFastifyError(fastifyError);
      reply
        .status(mapped.statusCode)
        .send(toErrorResponse(mapped, request.id));
      return;
    }

    app.log.error(error, "Unhandled error");
    const fallback = new AppError(
      "SYS_INTERNAL",
      "Internal server error",
      500,
    );
    reply.status(500).send(toErrorResponse(fallback, request.id));
  });

  done();
});
