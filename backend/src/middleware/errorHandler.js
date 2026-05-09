import { AppError } from "../utils/AppError.js";

const isDev = process.env.NODE_ENV !== "production";

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl,
  });
}

/**
 * Global Express error handler. Must be registered last.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const statusCode =
    err instanceof AppError ? err.statusCode : err.status ?? 500;
  const message =
    err instanceof Error ? err.message : "Internal server error";

  const body = {
    success: false,
    error: message,
    ...(err instanceof AppError && err.details ? { details: err.details } : {}),
    ...(isDev && !(err instanceof AppError) && err.stack
      ? { stack: err.stack }
      : {}),
  };

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json(body);
}
