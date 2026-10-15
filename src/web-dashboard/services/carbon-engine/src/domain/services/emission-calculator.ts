import { CarbonAmount } from "../value-objects/carbon-amount";
import type { Distance } from "../value-objects/distance";
import type { Weight } from "../value-objects/weight";
import type { EmissionFactor } from "../entities/emission-factor";
import type { TransportMode } from "../entities/transport-mode";

/**
 * Metode berbasis jarak (GHG Protocol / DEFRA):
 *   emisi (kg CO2e) = berat (ton) × jarak (km) × faktor (kg CO2e per ton-km)
 * Fungsi murni: tanpa I/O, tanpa jam sistem, mudah diuji.
 */
export function calculateEmission(weight: Weight, distance: Distance, factor: EmissionFactor): CarbonAmount {
  return CarbonAmount.fromKg(weight.toTons() * distance.toKm() * factor.kgCo2ePerTonKm);
}

export interface Warning {
  readonly code: "WEIGHT_EXCEEDS_MODE_CAPACITY";
  readonly message: string;
}

/**
 * Pengecekan kewajaran berat. Bukan error: data tetap dihitung, tetapi admin diberi
 * peringatan. Ini menjawab temuan lapangan "sering salah catat berat saat ramai,
 * tidak ada pengecekan ulang otomatis".
 */
export function checkWeightPlausibility(weight: Weight, mode: TransportMode): Warning[] {
  if (mode.maxPayloadKg !== null && weight.toKg() > mode.maxPayloadKg) {
    return [
      {
        code: "WEIGHT_EXCEEDS_MODE_CAPACITY",
        message:
          `Berat ${weight.toKg()} kg melebihi kapasitas umum ${mode.displayName} ` +
          `(${mode.maxPayloadKg} kg). Periksa kembali angka berat atau moda yang dipilih.`,
      },
    ];
  }
  return [];
}
