import type { EmissionTrendPoint } from "./mock-data";

/** Isi file CSV laporan: satu baris judul, lalu satu baris per titik data. by rafa*/
export function buildEmissionCsv(data: readonly EmissionTrendPoint[]): string {
  const header = "Tanggal,Total CO2e (kg),Jarak (km)\n";
  const rows = data.map((d) => `${d.date},${d.totalCO2eKg},${d.distanceKm}`).join("\n");
  return header + rows;
}

/** "Oktober 2026" -> "laporan-emisi-oktober-2026.csv" */
export function reportFileName(month: string): string {
  return `laporan-emisi-${month.toLowerCase().trim().replace(/\s+/g, "-")}.csv`;
}
