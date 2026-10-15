import type { Clock, EventPublisher, ShipmentEmissionRecord, ShipmentEmissionRepository } from "../ports";
import type { EmissionEstimator, EstimateResult } from "./emission-estimator";

export interface CalculateShipmentEmissionInput {
  shipmentId: string;
  modeCode: string;
  weightKg: number;
  distanceKm: number;
  shipmentDate?: Date | undefined;
}

export interface CalculateShipmentEmissionResult extends EstimateResult {
  readonly shipmentId: string;
  readonly calculatedAt: Date;
}

/**
 * Perhitungan resmi: menyimpan hasil dan mengumumkan event `emission.calculated`.
 * Idempoten per shipmentId (menghitung ulang menimpa hasil lama). Event bersifat
 * at-least-once: konsumen harus idempoten (lihat docs/arsitektur.md).
 */
export class CalculateShipmentEmission {
  constructor(
    private readonly estimator: EmissionEstimator,
    private readonly repository: ShipmentEmissionRepository,
    private readonly events: EventPublisher,
    private readonly clock: Clock,
  ) {}

  async execute(input: CalculateShipmentEmissionInput): Promise<CalculateShipmentEmissionResult> {
    const now = this.clock.now();
    const shipmentDate = input.shipmentDate ?? now;

    const estimate = await this.estimator.estimate({
      modeCode: input.modeCode,
      weightKg: input.weightKg,
      distanceKm: input.distanceKm,
      on: shipmentDate,
    });

    const record: ShipmentEmissionRecord = {
      shipmentId: input.shipmentId,
      modeCode: estimate.modeCode,
      emissionFactorId: estimate.emissionFactorId,
      weightKg: estimate.weightKg,
      distanceKm: estimate.distanceKm,
      totalCo2eKg: estimate.totalCo2eKg,
      method: "distance_based",
      shipmentDate,
      calculatedAt: now,
    };
    await this.repository.save(record);

    await this.events.publish({
      name: "emission.calculated",
      occurredAt: now,
      payload: {
        shipmentId: record.shipmentId,
        modeCode: record.modeCode,
        totalCo2eKg: record.totalCo2eKg,
      },
    });

    return { ...estimate, shipmentId: input.shipmentId, calculatedAt: now };
  }
}
