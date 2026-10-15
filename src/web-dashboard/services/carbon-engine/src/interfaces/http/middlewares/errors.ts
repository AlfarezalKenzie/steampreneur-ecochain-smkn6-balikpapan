import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { DomainError } from "../../../domain/errors";
import type { Logger } from "../../../infrastructure/logger";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

const DOMAIN_STATUS: Record<string, number> = {
  VALIDATION_ERROR: 422,
  UNKNOWN_TRANSPORT_MODE: 422,
  EMISSION_FACTOR_NOT_FOUND: 422,
  EMISSION_RECORD_NOT_FOUND: 404,
  SHIPMENT_NOT_FOUND: 404,
};

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Endpoint tidak ditemukan", requestId: req.requestId } });
};

/** Satu format error untuk semua kegagalan. Error tak terduga TIDAK membocorkan detail internal. */
export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (err, req, res, _next) => {
    const requestId = req.requestId;
    const send = (status: number, code: string, message: string, details?: unknown) =>
      res.status(status).json({ error: { code, message, ...(details ? { details } : {}), requestId } });

    if (err instanceof HttpError) return void send(err.status, err.code, err.message);

    if (err instanceof ZodError) {
      const details = err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
      return void send(422, "VALIDATION_ERROR", "Data yang dikirim tidak valid", details);
    }

    if (err instanceof DomainError) {
      return void send(DOMAIN_STATUS[err.code] ?? 422, err.code, err.message);
    }

    // Kesalahan dari body-parser (JSON rusak / terlalu besar)
    const type = (err as { type?: string }).type;
    if (type === "entity.parse.failed") return void send(400, "INVALID_JSON", "Body request bukan JSON yang valid");
    if (type === "entity.too.large") return void send(413, "PAYLOAD_TOO_LARGE", "Body request terlalu besar");

    logger.error({ err, requestId, method: req.method, path: req.path }, "unhandled error");
    return void send(500, "INTERNAL_ERROR", "Terjadi kesalahan pada server");
  };
}
