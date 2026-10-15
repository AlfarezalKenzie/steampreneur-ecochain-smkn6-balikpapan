import { Pool } from "pg";
import { buildUseCases, type Repositories } from "./composition";
import { loadConfig, type Config } from "./infrastructure/config";
import { createLogger } from "./infrastructure/logger";
import { LogEventPublisher } from "./infrastructure/messaging/log-event-publisher";
import {
  InMemoryEmissionFactorRepository,
  InMemoryShipmentEmissionRepository,
  InMemoryTransportModeRepository,
} from "./infrastructure/persistence/memory";
import {
  PgEmissionFactorRepository,
  PgShipmentEmissionRepository,
  PgTransportModeRepository,
} from "./infrastructure/persistence/postgres";
import { SEED_FACTORS, SEED_MODES } from "./infrastructure/persistence/seed-data";
import { createApp } from "./interfaces/http/app";

function main(): void {
  let config: Config;
  try {
    config = loadConfig();
  } catch (err) {
    // Satu baris yang jelas untuk operator, tanpa stack trace; nilai secret tidak pernah ikut tercetak.
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
  const logger = createLogger(config.logLevel);

  let repos: Repositories;
  let pool: Pool | undefined;
  let checkReady: () => Promise<boolean> = async () => true;

  if (config.databaseUrl) {
    pool = new Pool({ connectionString: config.databaseUrl, max: 10, idleTimeoutMillis: 30_000, statement_timeout: 5_000 });
    // Tanpa handler ini, error pada koneksi idle akan mematikan proses.
    pool.on("error", (err) => logger.error({ err }, "pg pool error"));
    repos = {
      modes: new PgTransportModeRepository(pool),
      factors: new PgEmissionFactorRepository(pool),
      emissions: new PgShipmentEmissionRepository(pool),
    };
    const p = pool;
    checkReady = async () => {
      await p.query("SELECT 1");
      return true;
    };
    logger.info("persistence: PostgreSQL");
  } else {
    repos = {
      modes: new InMemoryTransportModeRepository(SEED_MODES),
      factors: new InMemoryEmissionFactorRepository(SEED_FACTORS),
      emissions: new InMemoryShipmentEmissionRepository(),
    };
    logger.warn("persistence: IN-MEMORY (data hilang saat restart). Set DATABASE_URL untuk PostgreSQL.");
  }

  const useCases = buildUseCases(repos, new LogEventPublisher(logger));
  const app = createApp({ config, logger, useCases, checkReady });
  const server = app.listen(config.port, () => logger.info({ port: config.port }, "carbon-engine listening"));

  // Graceful shutdown: berhenti menerima koneksi baru, selesaikan yang berjalan, tutup pool.
  const shutdown = (signal: string) => {
    logger.info({ signal }, "shutting down");
    const force = setTimeout(() => process.exit(1), 10_000);
    force.unref();
    server.close(() => {
      void (pool?.end() ?? Promise.resolve()).finally(() => process.exit(0));
    });
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main();
