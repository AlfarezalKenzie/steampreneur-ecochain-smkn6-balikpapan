import { ValidationError } from "../errors";

// 100 ribu ton. Terkait kolom shipment_emissions.total_co2e_kg NUMERIC(14,4): dengan jarak maks
// 40.075 km dan faktor ~0,6 kg/ton-km, hasil terbesar ≈ 2,4 miliar kg, masih muat. Jika batas ini
// dinaikkan, periksa ulang presisi kolom tersebut.
const MAX_WEIGHT_KG = 100_000_000;

/** Berat muatan. Disimpan dalam kg (satuan input admin), dikonversi ke ton untuk perhitungan. */
export class Weight {
  private constructor(private readonly kg: number) {}

  static fromKg(value: number): Weight {
    if (!Number.isFinite(value)) throw new ValidationError("Berat harus berupa angka yang valid");
    if (value <= 0) throw new ValidationError("Berat harus lebih dari 0 kg");
    if (value > MAX_WEIGHT_KG) throw new ValidationError("Berat melebihi batas kewajaran");
    return new Weight(value);
  }

  toKg(): number {
    return this.kg;
  }

  toTons(): number {
    return this.kg / 1000;
  }
}
