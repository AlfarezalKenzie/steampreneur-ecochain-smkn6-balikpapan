import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const SAFE_ID = /^[A-Za-z0-9_-]{8,64}$/;

/** ID korelasi per request. ID dari klien hanya diterima jika berformat aman (cegah log injection). */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header("x-request-id");
  req.requestId = incoming && SAFE_ID.test(incoming) ? incoming : randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
}
