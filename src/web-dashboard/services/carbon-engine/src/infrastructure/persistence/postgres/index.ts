import type { EmissionFactor } from "../../../domain/entities/emission-factor";
import { ShipmentNotFoundError } from "../../../domain/errors";
import type { TransportMode } from "../../../domain/entities/transport-mode";
import type {
  EmissionFactorRepository,
  EmissionSummary,
  ShipmentEmissionRecord,
  ShipmentEmissionRepository,
  TransportModeRepository,
} from "../../../application/ports";

/** Subset dari pg.Pool/pg.Client yang kita butuhkan: memudahkan test & penggantian driver. */
export interface Queryable {
  query<R = Record<string, unknown>>(text: string, params?: unknown[]): Promise<{ rows: R[] }>;
}

// Kolom DATE dibaca sebagai teks (YYYY-MM-DD) agar tidak terkena konversi zona waktu lokal oleh driver.
const dateOnly = (s: string): Date => new Date(`${s}T00:00:00Z`);
const num = (v: unknown): number => Number(v);

export class PgTransportModeRepository implements TransportModeRepository {
  constructor(private readonly db: Queryable) {}

  async findByCode(code: string): Promise<TransportMode | null> {
    const { rows } = await this.db.query<{ code: string; display_name: string; max_payload_kg: string | null }>(
      `SELECT code, display_name, max_payload_kg FROM transport_modes WHERE code = $1 AND is_active`,
      [code],
    );
    const r = rows[0];
    if (!r) return null;
    return { code: r.code, displayName: r.display_name, maxPayloadKg: r.max_payload_kg === null ? null : num(r.max_payload_kg) };
  }
}

export class PgEmissionFactorRepository implements EmissionFactorRepository {
  constructor(private readonly db: Queryable) {}

  async findActiveForMode(modeCode: string, on: Date): Promise<EmissionFactor | null> {
    const day = on.toISOString().slice(0, 10); // faktor berlaku per tanggal (UTC)
    const { rows } = await this.db.query<{
      id: string; mode_code: string; factor: string; source: string; valid_from: string; valid_to: string | null;
    }>(
      `SELECT ef.id, tm.code AS mode_code, ef.factor_kg_co2e_per_ton_km AS factor, ef.source,
              ef.valid_from::text AS valid_from, ef.valid_to::text AS valid_to
         FROM emission_factors ef
         JOIN transport_modes tm ON tm.id = ef.transport_mode_id
        WHERE tm.code = $1
          AND ef.valid_from <= $2::date
          AND (ef.valid_to IS NULL OR ef.valid_to > $2::date)
        ORDER BY ef.valid_from DESC
        LIMIT 1`,
      [modeCode, day],
    );
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id,
      modeCode: r.mode_code,
      kgCo2ePerTonKm: num(r.factor),
      source: r.source,
      validFrom: dateOnly(r.valid_from),
      validTo: r.valid_to === null ? null : dateOnly(r.valid_to),
    };
  }
}

export class PgShipmentEmissionRepository implements ShipmentEmissionRepository {
  constructor(private readonly db: Queryable) {}

  async save(r: ShipmentEmissionRecord): Promise<void> {
    try {
      await this.insert(r);
    } catch (err) {
      // 23503 = foreign_key_violation. Jika yang dilanggar adalah relasi ke `shipments`, pengiriman itu
      // memang belum ada (dibuat Service A): itu kesalahan klien (404), bukan kegagalan server (500).
      const e = err as { code?: string; constraint?: string };
      if (e.code === "23503" && e.constraint?.includes("shipment_id")) throw new ShipmentNotFoundError(r.shipmentId);
      throw err;
    }
  }

  private async insert(r: ShipmentEmissionRecord): Promise<void> {
    await this.db.query(
      `INSERT INTO shipment_emissions
         (shipment_id, emission_factor_id, distance_km_used, weight_ton_used, total_co2e_kg,
          calculation_method, shipment_date, calculated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (shipment_id) DO UPDATE SET
          emission_factor_id = EXCLUDED.emission_factor_id,
          distance_km_used   = EXCLUDED.distance_km_used,
          weight_ton_used    = EXCLUDED.weight_ton_used,
          total_co2e_kg      = EXCLUDED.total_co2e_kg,
          calculation_method = EXCLUDED.calculation_method,
          shipment_date      = EXCLUDED.shipment_date,
          calculated_at      = EXCLUDED.calculated_at`,
      [r.shipmentId, r.emissionFactorId, r.distanceKm, r.weightKg / 1000, r.totalCo2eKg, r.method, r.shipmentDate, r.calculatedAt],
    );
  }

  async findByShipmentId(shipmentId: string): Promise<ShipmentEmissionRecord | null> {
    const { rows } = await this.db.query<{
      shipment_id: string; emission_factor_id: string; mode_code: string; distance_km_used: string;
      weight_ton_used: string; total_co2e_kg: string; shipment_date: Date; calculated_at: Date;
    }>(
      `SELECT se.shipment_id, se.emission_factor_id, tm.code AS mode_code, se.distance_km_used,
              se.weight_ton_used, se.total_co2e_kg, se.shipment_date, se.calculated_at
         FROM shipment_emissions se
         JOIN emission_factors ef ON ef.id = se.emission_factor_id
         JOIN transport_modes tm ON tm.id = ef.transport_mode_id
        WHERE se.shipment_id = $1`,
      [shipmentId],
    );
    const r = rows[0];
    if (!r) return null;
    return {
      shipmentId: r.shipment_id,
      modeCode: r.mode_code,
      emissionFactorId: r.emission_factor_id,
      weightKg: Math.round(num(r.weight_ton_used) * 1e6) / 1e3, // ton → kg tanpa error floating point
      distanceKm: num(r.distance_km_used),
      totalCo2eKg: num(r.total_co2e_kg),
      method: "distance_based",
      shipmentDate: r.shipment_date,
      calculatedAt: r.calculated_at,
    };
  }

  async summarize(from: Date, to: Date): Promise<EmissionSummary> {
    const { rows } = await this.db.query<{ mode_code: string; shipment_count: string; co2e_kg: string }>(
      `SELECT tm.code AS mode_code, COUNT(*) AS shipment_count, SUM(se.total_co2e_kg) AS co2e_kg
         FROM shipment_emissions se
         JOIN emission_factors ef ON ef.id = se.emission_factor_id
         JOIN transport_modes tm ON tm.id = ef.transport_mode_id
        WHERE se.shipment_date >= $1 AND se.shipment_date < $2
        GROUP BY tm.code`,
      [from, to],
    );
    const byMode = rows
      .map((r) => ({ modeCode: r.mode_code, shipmentCount: num(r.shipment_count), co2eKg: num(r.co2e_kg) }))
      .sort((a, b) => b.co2eKg - a.co2eKg);
    return {
      from,
      to,
      shipmentCount: byMode.reduce((s, m) => s + m.shipmentCount, 0),
      totalCo2eKg: Math.round(byMode.reduce((s, m) => s + m.co2eKg, 0) * 1e4) / 1e4,
      byMode,
    };
  }
}
