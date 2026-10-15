import express, { type Express } from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import type { Config } from "../../infrastructure/config";
import type { Logger } from "../../infrastructure/logger";
import { authenticate } from "./middlewares/auth";
import { errorHandler, notFoundHandler } from "./middlewares/errors";
import { requestId } from "./middlewares/request-id";
import { emissionRoutes, type EmissionUseCases } from "./routes/emission-routes";

export interface AppDeps {
  config: Config;
  logger: Logger;
  useCases: EmissionUseCases;
  /** Dipanggil oleh /ready. Lempar error / return false jika dependensi (mis. database) tidak siap. */
  checkReady: () => Promise<boolean>;
}

z.config(z.locales.id()); // pesan validasi berbahasa Indonesia

export function createApp({ config, logger, useCases, checkReady }: AppDeps): Express {
  const app = express();
  app.set("trust proxy", config.trustProxy ? 1 : false);

  app.use(helmet());
  app.use(requestId);
  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on("finish", () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      logger.info({ requestId: req.requestId, method: req.method, path: req.path, status: res.statusCode, ms: Math.round(ms) }, "request");
    });
    next();
  });

  // Probe infrastruktur: tanpa auth dan tanpa rate limit (dipanggil orkestrator tiap beberapa detik).
  app.get("/health", (_req, res) => void res.json({ status: "ok" }));
  app.get("/ready", async (_req, res) => {
    let ready = false;
    try {
      ready = await checkReady();
    } catch (err) {
      logger.warn({ err }, "readiness check gagal");
    }
    res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "unavailable" });
  });

  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: config.rateLimitPerMinute,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({ error: { code: "RATE_LIMITED", message: "Terlalu banyak request, coba lagi sebentar", requestId: req.requestId } });
      },
    }),
  );

  app.use(express.json({ limit: "10kb" }));

  app.use("/v1", authenticate(config), emissionRoutes(useCases));

  app.use(notFoundHandler);
  app.use(errorHandler(logger));
  return app;
}
