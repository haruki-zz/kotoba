import { FastifyError } from "fastify";
import { ZodError, ZodIssue } from "zod";

export type ErrorCode =
  | "VAL_INVALID_BODY"
  | "VAL_INVALID_QUERY"
  | "VAL_INVALID_PARAMS"
  | "REQ_BAD_REQUEST"
  | "REQ_UNAUTHORIZED"
  | "REQ_FORBIDDEN"
  | "REQ_RATE_LIMIT"
  | "RES_NOT_FOUND"
  | "WORD_NOT_FOUND"
  | "SETTINGS_NOT_FOUND"
  | "AUTH_TOKEN_REQUIRED"
  | "AUTH_INVALID_TOKEN"
  | "SYS_INTERNAL";

export type ErrorResponse = {
  ok: false;
  code: ErrorCode;
  message: string;
  details?: unknown;
  requestId?: string;
};

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const isAppError = (error: unknown): error is AppError =>
  error instanceof AppError;

const buildFieldErrors = (error: ZodError) => {
  const fieldErrors: Record<string, string[]> = {};
  error.issues.forEach((issue: ZodIssue) => {
    const path = issue.path.join(".");
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  });
  return fieldErrors;
};

export const fromZodError = (
  error: ZodError,
  source: "body" | "query" | "params",
): AppError => {
  const codeMap = {
    body: "VAL_INVALID_BODY",
    query: "VAL_INVALID_QUERY",
    params: "VAL_INVALID_PARAMS",
  } as const;
  return new AppError(codeMap[source], `Invalid request ${source}`, 400, {
    issues: error.issues,
    fieldErrors: buildFieldErrors(error),
  });
};

export const fromFastifyError = (error: FastifyError) => {
  if (error.statusCode === 429) {
    return new AppError(
      "REQ_RATE_LIMIT",
      error.message || "Too Many Requests",
      429,
    );
  }

  if (error.statusCode === 404) {
    return new AppError(
      "RES_NOT_FOUND",
      error.message || "Resource not found",
      404,
    );
  }

  if (error.statusCode === 401) {
    return new AppError(
      "REQ_UNAUTHORIZED",
      error.message || "Unauthorized",
      401,
    );
  }

  return new AppError(
    "REQ_BAD_REQUEST",
    error.message || "Bad Request",
    error.statusCode ?? 400,
  );
};

export const toErrorResponse = (
  error: AppError,
  requestId?: string,
): ErrorResponse => ({
  ok: false,
  code: error.code,
  message: error.message,
  details: error.details,
  requestId,
});
