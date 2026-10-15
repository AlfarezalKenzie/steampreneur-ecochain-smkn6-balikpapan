import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4002),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET minimal 32 karakter"),
  JWT_ISSUER: z.string().min(1),
  JWT_AUDIENCE: z.string().min(1),
  DATABASE_URL: z.string().optional(),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(120),
  TRUST_PROXY: z.enum(["true", "false"]).default("false"),
});

export interface Config {
  nodeEnv: "development" | "test" | "production";
  port: number;
  logLevel: string;
  jwt: { secret: string; issuer: string; audience: string };
  databaseUrl: string | undefined;
  rateLimitPerMinute: number;
  trustProxy: boolean;
}

/**
 * Memvalidasi environment saat startup (fail-fast). Pesan error hanya menyebut NAMA variabel,
 * tidak pernah nilainya, agar secret tidak bocor ke log.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join(".") || "(env)"}: ${i.message}`).join("; ");
    throw new Error(`Konfigurasi environment tidak valid: ${problems}`);
  }
  const e = parsed.data;
  if (e.NODE_ENV === "production" && e.JWT_SECRET.startsWith("dev-only")) {
    throw new Error("Konfigurasi environment tidak valid: JWT_SECRET contoh dev tidak boleh dipakai di production");
  }
  return {
    nodeEnv: e.NODE_ENV,
    port: e.PORT,
    logLevel: e.LOG_LEVEL,
    jwt: { secret: e.JWT_SECRET, issuer: e.JWT_ISSUER, audience: e.JWT_AUDIENCE },
    databaseUrl: e.DATABASE_URL && e.DATABASE_URL.length > 0 ? e.DATABASE_URL : undefined,
    rateLimitPerMinute: e.RATE_LIMIT_PER_MINUTE,
    trustProxy: e.TRUST_PROXY === "true",
  };
}
