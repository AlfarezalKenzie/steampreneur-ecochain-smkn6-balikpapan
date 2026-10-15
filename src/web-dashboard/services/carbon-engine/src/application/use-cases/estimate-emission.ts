import type { Clock } from "../ports";
import type { EmissionEstimator, EstimateResult } from "./emission-estimator";

export interface EstimateEmissionInput {
  modeCode: string;
  weightKg: number;
  distanceKm: number;
  shipmentDate?: Date | undefined;
}

/** Estimasi sekilas untuk form "Catat Pengiriman": tidak menyimpan apa pun. */
export class EstimateEmission {
  constructor(
    private readonly estimator: EmissionEstimator,
    private readonly clock: Clock,
  ) {}

  execute(input: EstimateEmissionInput): Promise<EstimateResult> {
    return this.estimator.estimate({
      modeCode: input.modeCode,
      weightKg: input.weightKg,
      distanceKm: input.distanceKm,
      on: input.shipmentDate ?? this.clock.now(),
    });
  }
}
