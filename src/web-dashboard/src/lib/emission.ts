/**
 * Rumus estimasi emisi (metode berbasis jarak, GHG Protocol / DEFRA):
 *   emisi (kg CO2e) = berat (kg) / 1000 × jarak (km) × faktor (kg CO2e per ton-km)
 * Dibulatkan 4 desimal, sama dengan Carbon Engine (services/carbon-engine), supaya
 * angka di form dan di server tidak berbeda saat nanti keduanya dihubungkan.
 */
export function estimateCO2eKg(weightKg: number, distanceKm: number, factorKgCO2ePerTonKm: number): number {
  const raw = (weightKg / 1000) * distanceKm * factorKgCO2ePerTonKm;
  return Math.round((raw + Number.EPSILON) * 1e4) / 1e4;
}
