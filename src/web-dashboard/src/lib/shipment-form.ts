import { COMMON_ROUTES, CUSTOM_ROUTE_LABEL } from "./common-routes";

export interface FormState {
  customerRef: string;
  routeLabel: string;
  distanceKm: string; // string agar input kosong tidak berubah menjadi "0"
  weightKg: string;
  modeCode: string;
}

export const EMPTY_FORM: FormState = { customerRef: "", routeLabel: "", distanceKm: "", weightKg: "", modeCode: "" };

export type FormErrors = Partial<Record<keyof FormState, string>>;

/** Jarak yang dipakai: dari rute umum, atau isian manual jika "Lainnya". null = belum valid. */
export function resolveDistanceKm(form: FormState): number | null {
  if (form.routeLabel === CUSTOM_ROUTE_LABEL) {
    const v = Number(form.distanceKm);
    return form.distanceKm.trim() !== "" && Number.isFinite(v) && v > 0 ? v : null;
  }
  return COMMON_ROUTES.find((r) => r.label === form.routeLabel)?.distanceKm ?? null;
}

export function parseWeightKg(form: FormState): number | null {
  const v = Number(form.weightKg);
  return form.weightKg.trim() !== "" && Number.isFinite(v) && v > 0 ? v : null;
}

/** Semua kolom wajib. Pesan kesalahan ditampilkan di bawah kolom yang bermasalah. */
export function validateShipmentForm(form: FormState): FormErrors {
  const e: FormErrors = {};
  if (!form.customerRef.trim()) e.customerRef = "Wajib diisi — untuk menelusuri pengiriman ini nanti.";
  if (!form.routeLabel) e.routeLabel = "Pilih tujuan pengiriman.";
  if (form.routeLabel === CUSTOM_ROUTE_LABEL && resolveDistanceKm(form) === null) e.distanceKm = "Masukkan jarak dalam kilometer.";
  if (parseWeightKg(form) === null) e.weightKg = "Berat harus lebih dari 0 kg.";
  if (!form.modeCode) e.modeCode = "Moda transportasi wajib dipilih — dibutuhkan untuk hitung emisi.";
  return e;
}

/**
 * Estimasi hanya butuh tujuan, berat, dan moda. Referensi pesanan wajib untuk MENCATAT
 * tetapi tidak memengaruhi angka emisi, jadi tidak boleh menahan pratinjau estimasi.
 */
export function canEstimate(errors: FormErrors): boolean {
  const { customerRef: _ignored, ...rest } = errors;
  return Object.keys(rest).length === 0;
}
