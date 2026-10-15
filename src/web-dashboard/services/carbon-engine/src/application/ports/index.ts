import type { EmissionFactor } from "../../domain/entities/emission-factor";
import type { TransportMode } from "../../domain/entities/transport-mode";

/**
 * Port = kontrak yang dibutuhkan use case dari dunia luar. Implementasinya
 * ada di `infrastructure/` (Dependency Inversion): use case tidak tahu apakah
 * datanya dari PostgreSQL, memori, atau layanan lain.
 */

export interface TransportModeRepository {
  findByCode(code: string): Promise<TransportMode | null>;
}

export interface EmissionFactorRepository {
  /** Faktor yang berlaku pada tanggal `on` untuk moda tersebut, atau null. */
  findActiveForMode(modeCode: string, on: Date): Promise<EmissionFactor | null>;
}

export interface ShipmentEmissionRecord {
  readonly shipmentId: string;
  readonly modeCode: string;
  readonly emissionFactorId: string;
  readonly weightKg: number;
  readonly distanceKm: number;
  readonly totalCo2eKg: number;
  readonly method: "distance_based";
  readonly shipmentDate: Date;
  readonly calculatedAt: Date;
}

export interface ModeSummary {
  readonly modeCode: string;
  readonly shipmentCount: number;
  readonly co2eKg: number;
}

export interface EmissionSummary {
  readonly from: Date;
  readonly to: Date;
  readonly shipmentCount: number;
  readonly totalCo2eKg: number;
  readonly byMode: readonly ModeSummary[];
}

export interface ShipmentEmissionRepository {
  /** Upsert berdasarkan shipmentId: menghitung ulang menimpa hasil lama (idempoten). */
  save(record: ShipmentEmissionRecord): Promise<void>;
  findByShipmentId(shipmentId: string): Promise<ShipmentEmissionRecord | null>;
  /** Rentang setengah-terbuka [from, to) berdasarkan tanggal pengiriman. */
  summarize(from: Date, to: Date): Promise<EmissionSummary>;
}

export interface DomainEvent<T = unknown> {
  readonly name: string;
  readonly occurredAt: Date;
  readonly payload: T;
}

export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
}

export interface Clock {
  now(): Date;
}
