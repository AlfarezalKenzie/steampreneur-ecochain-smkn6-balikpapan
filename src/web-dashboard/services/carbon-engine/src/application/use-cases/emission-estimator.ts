import { Distance } from "../../domain/value-objects/distance";
import { Weight } from "../../domain/value-objects/weight";
import { calculateEmission, checkWeightPlausibility, type Warning } from "../../domain/services/emission-calculator";
import { EmissionFactorNotFoundError, UnknownTransportModeError } from "../../domain/errors";
import type { EmissionFactorRepository, TransportModeRepository } from "../ports";

export interface EstimateInput {
  readonly modeCode: string;
  readonly weightKg: number;
  readonly distanceKm: number;
  /** Tanggal pengiriman: menentukan versi faktor emisi yang dipakai. */
  readonly on: Date;
}

export interface EstimateResult {
  readonly modeCode: string;
  readonly modeDisplayName: string;
  readonly weightKg: number;
  readonly distanceKm: number;
  readonly emissionFactorId: string;
  readonly factorKgCo2ePerTonKm: number;
  readonly factorSource: string;
  readonly totalCo2eKg: number;
  readonly warnings: readonly Warning[];
}

/** Logika bersama untuk estimasi (tanpa simpan) dan perhitungan resmi (dengan simpan). */
export class EmissionEstimator {
  constructor(
    private readonly modes: TransportModeRepository,
    private readonly factors: EmissionFactorRepository,
  ) {}

  async estimate(input: EstimateInput): Promise<EstimateResult> {
    const weight = Weight.fromKg(input.weightKg);
    const distance = Distance.fromKm(input.distanceKm);

    const mode = await this.modes.findByCode(input.modeCode);
    if (!mode) throw new UnknownTransportModeError(input.modeCode);

    const factor = await this.factors.findActiveForMode(input.modeCode, input.on);
    if (!factor) throw new EmissionFactorNotFoundError(input.modeCode, input.on);

    const total = calculateEmission(weight, distance, factor);

    return {
      modeCode: mode.code,
      modeDisplayName: mode.displayName,
      weightKg: weight.toKg(),
      distanceKm: distance.toKm(),
      emissionFactorId: factor.id,
      factorKgCo2ePerTonKm: factor.kgCo2ePerTonKm,
      factorSource: factor.source,
      totalCo2eKg: total.toKg(),
      warnings: checkWeightPlausibility(weight, mode),
    };
  }
}
