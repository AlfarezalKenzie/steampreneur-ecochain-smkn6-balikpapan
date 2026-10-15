import { ValidationError } from "../errors";

// Keliling bumi ≈ 40.075 km. Satu perjalanan tidak mungkin melebihi ini secara wajar.
const MAX_DISTANCE_KM = 40_075;

export class Distance {
  private constructor(private readonly km: number) {}

  static fromKm(value: number): Distance {
    if (!Number.isFinite(value)) throw new ValidationError("Jarak harus berupa angka yang valid");
    if (value <= 0) throw new ValidationError("Jarak harus lebih dari 0 km");
    if (value > MAX_DISTANCE_KM) throw new ValidationError("Jarak melebihi batas kewajaran satu perjalanan");
    return new Distance(value);
  }

  toKm(): number {
    return this.km;
  }
}
