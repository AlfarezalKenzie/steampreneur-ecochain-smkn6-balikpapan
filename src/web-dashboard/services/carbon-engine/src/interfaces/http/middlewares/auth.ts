import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import type { Config } from "../../../infrastructure/config";
import { HttpError } from "./errors";

export interface AuthUser {
  readonly id: string;
  readonly role: string;
  readonly permissions: ReadonlySet<string>;
}

const claimsSchema = z.object({
  sub: z.string().min(1),
  role: z.string().min(1),
  permissions: z.array(z.string()),
});

/**
 * Verifikasi JWT (HS256, issuer & audience dikunci). Alasan kegagalan SENGAJA tidak dirinci ke
 * klien. Token diterbitkan oleh Service A (auth); untuk produksi sebaiknya beralih ke
 * RS256/EdDSA agar Service B hanya memegang public key dan tidak bisa menerbitkan token.
 */
export function authenticate(config: Config) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.header("authorization");
    const match = header?.match(/^Bearer ([\w-]+\.[\w-]+\.[\w-]+)$/);
    if (!match?.[1]) throw new HttpError(401, "UNAUTHENTICATED", "Autentikasi diperlukan");

    let payload: unknown;
    try {
      payload = jwt.verify(match[1], config.jwt.secret, {
        algorithms: ["HS256"],
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      });
    } catch {
      throw new HttpError(401, "UNAUTHENTICATED", "Token tidak valid atau kedaluwarsa");
    }

    const claims = claimsSchema.safeParse(payload);
    if (!claims.success) throw new HttpError(401, "UNAUTHENTICATED", "Token tidak valid atau kedaluwarsa");

    req.user = { id: claims.data.sub, role: claims.data.role, permissions: new Set(claims.data.permissions) };
    next();
  };
}

/** RBAC: izin dicek per rute, berdasarkan kode permission yang sama dengan tabel `permissions`. */
export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new HttpError(401, "UNAUTHENTICATED", "Autentikasi diperlukan");
    if (!req.user.permissions.has(permission)) {
      throw new HttpError(403, "FORBIDDEN", "Anda tidak memiliki izin untuk aksi ini");
    }
    next();
  };
}
