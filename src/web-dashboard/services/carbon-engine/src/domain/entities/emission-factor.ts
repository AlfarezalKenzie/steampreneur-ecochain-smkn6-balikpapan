/**
 * Faktor emisi bersifat berjangka waktu: regulator merilis angka baru tiap tahun,
 * jadi perhitungan memakai faktor yang berlaku pada TANGGAL PENGIRIMAN,
 * bukan "faktor terbaru" (agar laporan historis tidak berubah diam-diam).
 */
export interface EmissionFactor {
  readonly id: string;
  readonly modeCode: string;
  readonly kgCo2ePerTonKm: number;
  readonly source: string;
  readonly validFrom: Date;
  /** null = masih berlaku. Batas atas bersifat eksklusif. */
  readonly validTo: Date | null;
}

export function isFactorActiveOn(factor: EmissionFactor, on: Date): boolean {
  return factor.validFrom <= on && (factor.validTo === null || on < factor.validTo);
}
