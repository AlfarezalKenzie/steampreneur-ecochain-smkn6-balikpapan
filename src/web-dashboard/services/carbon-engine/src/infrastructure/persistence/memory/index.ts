import { isFactorActiveOn, type EmissionFactor } from "../../../domain/entities/emission-factor";
import type { TransportMode } from "../../../domain/entities/transport-mode";
import type {
  EmissionFactorRepository,
  EmissionSummary,
  ModeSummary,
  ShipmentEmissionRecord,
  ShipmentEmissionRepository,
  TransportModeRepository,
} from "../../../application/ports";

export class InMemoryTransportModeRepository implements TransportModeRepository {
  constructor(private readonly modes: readonly TransportMode[]) {}
  async findByCode(code: string): Promise<TransportMode | null> {
    return this.modes.find((m) => m.code === code) ?? null;
  }
}

export class InMemoryEmissionFactorRepository implements EmissionFactorRepository {
  constructor(private readonly factors: readonly EmissionFactor[]) {}
  async findActiveForMode(modeCode: string, on: Date): Promise<EmissionFactor | null> {
    const candidates = this.factors
      .filter((f) => f.modeCode === modeCode && isFactorActiveOn(f, on))
      .sort((a, b) => b.validFrom.getTime() - a.validFrom.getTime());
    return candidates[0] ?? null;
  }
}

export class InMemoryShipmentEmissionRepository implements ShipmentEmissionRepository {
  private readonly records = new Map<string, ShipmentEmissionRecord>();

  async save(record: ShipmentEmissionRecord): Promise<void> {
    this.records.set(record.shipmentId, record);
  }

  async findByShipmentId(shipmentId: string): Promise<ShipmentEmissionRecord | null> {
    return this.records.get(shipmentId) ?? null;
  }

  async summarize(from: Date, to: Date): Promise<EmissionSummary> {
    const byMode = new Map<string, { count: number; co2e: number }>();
    let total = 0;
    let count = 0;
    for (const r of this.records.values()) {
      if (r.shipmentDate < from || r.shipmentDate >= to) continue;
      total += r.totalCo2eKg;
      count += 1;
      const entry = byMode.get(r.modeCode) ?? { count: 0, co2e: 0 };
      entry.count += 1;
      entry.co2e += r.totalCo2eKg;
      byMode.set(r.modeCode, entry);
    }
    const modes: ModeSummary[] = [...byMode.entries()]
      .map(([modeCode, v]) => ({ modeCode, shipmentCount: v.count, co2eKg: round4(v.co2e) }))
      .sort((a, b) => b.co2eKg - a.co2eKg);
    return { from, to, shipmentCount: count, totalCo2eKg: round4(total), byMode: modes };
  }
}

const round4 = (n: number) => Math.round((n + Number.EPSILON) * 1e4) / 1e4;
