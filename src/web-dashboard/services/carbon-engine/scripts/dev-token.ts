/**
 * HANYA UNTUK PENGEMBANGAN LOKAL: menerbitkan JWT uji agar endpoint bisa dicoba tanpa Service A.
 * Di produksi token diterbitkan oleh layanan autentikasi, bukan skrip ini.
 *
 * Pemakaian:  npm run dev-token -- ops_manager
 */
import jwt from "jsonwebtoken";
import { loadConfig } from "../src/infrastructure/config";

// Cermin database/003_rbac_seed.sql (mapping role -> permission).
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ["shipment:create", "shipment:read", "shipment:update", "shipment:delete", "order:create", "order:read", "emission:read", "emission:recalculate", "user:manage", "tracking:submit"],
  ops_manager: ["shipment:create", "shipment:read", "shipment:update", "shipment:delete", "order:create", "order:read", "emission:read", "emission:recalculate", "tracking:submit"],
  courier: ["shipment:read", "shipment:update", "tracking:submit"],
  auditor: ["shipment:read", "order:read", "emission:read"],
};

const role = process.argv[2] ?? "ops_manager";
const permissions = ROLE_PERMISSIONS[role];
if (!permissions) {
  console.error(`Role tidak dikenal: ${role}. Pilihan: ${Object.keys(ROLE_PERMISSIONS).join(", ")}`);
  process.exit(1);
}

const config = loadConfig();
const token = jwt.sign({ role, permissions }, config.jwt.secret, {
  algorithm: "HS256",
  subject: `dev-${role}`,
  issuer: config.jwt.issuer,
  audience: config.jwt.audience,
  expiresIn: "8h",
});
console.log(token);
