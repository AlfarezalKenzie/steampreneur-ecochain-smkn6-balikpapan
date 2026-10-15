import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Gabungkan class Tailwind dengan aman, menghindari konflik utility yang bentrok. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format angka dengan pemisah ribuan ala Indonesia, dipakai utk metrik & tabel. */
export function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** Format kg CO2e menjadi satuan yang mudah dibaca (kg vs ton). */
export function formatCO2e(kg: number): string {
  if (kg >= 1000) return `${formatNumber(kg / 1000, 1)} ton CO2e`;
  return `${formatNumber(kg, 1)} kg CO2e`;
}
