import pino, { type Logger } from "pino";

export type { Logger };

export function createLogger(level: string): Logger {
  return pino({
    level,
    // Jangan pernah mencatat kredensial, walau tidak sengaja ikut ter-log.
    redact: { paths: ["req.headers.authorization", "headers.authorization", "*.password", "*.token"], censor: "[REDACTED]" },
  });
}
