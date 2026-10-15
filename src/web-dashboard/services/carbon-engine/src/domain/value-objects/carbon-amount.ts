import { ValidationError } from "../errors";

const PRECISION = 4; // desimal; cukup untuk pelaporan kg CO2e per pengiriman

/** Jumlah emisi dalam kg CO2e. Selalu dibulatkan agar hasil deterministik di semua layer. */
export class CarbonAmount {
  private constructor(private readonly kgCo2e: number) {}

  static fromKg(value: number): CarbonAmount {
    if (!Number.isFinite(value) || value < 0) throw new ValidationError("Jumlah emisi tidak valid");
    const factor = 10 ** PRECISION;
    return new CarbonAmount(Math.round((value + Number.EPSILON) * factor) / factor);
  }

  toKg(): number {
    return this.kgCo2e;
  }
}
