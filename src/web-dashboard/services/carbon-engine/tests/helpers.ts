import jwt from "jsonwebtoken";
import request from "supertest";
import { buildUseCases } from "../src/composition";
import type { Clock, DomainEvent, EventPublisher } from "../src/application/ports";
import type { EmissionFactor } from "../src/domain/entities/emission-factor";
import type { Config } from "../src/infrastructure/config";
import { createLogger } from "../src/infrastructure/logger";
import {
  InMemoryEmissionFactorRepository,
  InMemoryShipmentEmissionRepository,
  InMemoryTransportModeRepository,
} from "../src/infrastructure/persistence/memory";
import { SEED_FACTORS, SEED_MODES } from "../src/infrastructure/persistence/seed-data";
import { createApp } from "../src/interfaces/http/app";

export const NOW = new Date("2026-10-11T03:00:00Z");
export const fixedClock: Clock = { now: () => NOW };

export const testConfig: Config = {
  nodeEnv: "test",
  port: 0,
  logLevel: "silent",
  jwt: { secret: "test-secret-test-secret-test-secret-123", issuer: "test-issuer", audience: "test-audience" },
  databaseUrl: undefined,
  rateLimitPerMinute: 1000,
  trustProxy: false,
};

export class SpyPublisher implements EventPublisher {
  readonly events: DomainEvent[] = [];
  async publish(event: DomainEvent): Promise<void> {
    this.events.push(event);
  }
}

export function buildMemoryRepos(factors: readonly EmissionFactor[] = SEED_FACTORS) {
  return {
    modes: new InMemoryTransportModeRepository(SEED_MODES),
    factors: new InMemoryEmissionFactorRepository(factors),
    emissions: new InMemoryShipmentEmissionRepository(),
  };
}

export function buildTestApp(overrides: Partial<Config> = {}, checkReady: () => Promise<boolean> = async () => true) {
  const config = { ...testConfig, ...overrides };
  const publisher = new SpyPublisher();
  const repos = buildMemoryRepos();
  const useCases = buildUseCases(repos, publisher, fixedClock);
  const app = createApp({ config, logger: createLogger("silent"), useCases, checkReady });
  return { app, publisher, repos, config };
}

export const ROLE_PERMISSIONS = {
  ops_manager: ["shipment:create", "shipment:read", "emission:read", "emission:recalculate"],
  auditor: ["shipment:read", "order:read", "emission:read"],
  courier: ["shipment:read", "shipment:update", "tracking:submit"],
} as const;

export function tokenFor(
  role: keyof typeof ROLE_PERMISSIONS,
  opts: { secret?: string; issuer?: string; audience?: string; expiresIn?: number } = {},
): string {
  return jwt.sign({ role, permissions: ROLE_PERMISSIONS[role] }, opts.secret ?? testConfig.jwt.secret, {
    algorithm: "HS256",
    subject: `user-${role}`,
    issuer: opts.issuer ?? testConfig.jwt.issuer,
    audience: opts.audience ?? testConfig.jwt.audience,
    expiresIn: opts.expiresIn ?? 3600, // detik
  });
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
export { request };
