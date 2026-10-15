import type { ShipmentStatus } from "@/components/ui/status-pill";

export interface EmissionTrendPoint {
  date: string; // format: "DD MMM"
  totalCO2eKg: number;
  distanceKm: number;
}

// Skala harian ±25-35 kg CO2e, konsisten dengan total bulanan ~842 kg untuk
// satu cabang ekspedisi skala menengah (bukan ribuan kg seperti versi fleet
// nasional sebelumnya).
export const emissionTrend30d: EmissionTrendPoint[] = [
  { date: "11 Sep", totalCO2eKg: 26.4, distanceKm: 312 },
  { date: "13 Sep", totalCO2eKg: 29.8, distanceKm: 348 },
  { date: "15 Sep", totalCO2eKg: 24.1, distanceKm: 286 },
  { date: "17 Sep", totalCO2eKg: 31.2, distanceKm: 365 },
  { date: "19 Sep", totalCO2eKg: 28.6, distanceKm: 330 },
  { date: "21 Sep", totalCO2eKg: 22.9, distanceKm: 268 },
  { date: "23 Sep", totalCO2eKg: 27.3, distanceKm: 318 },
  { date: "25 Sep", totalCO2eKg: 33.5, distanceKm: 392 },
  { date: "27 Sep", totalCO2eKg: 29.1, distanceKm: 340 },
  { date: "29 Sep", totalCO2eKg: 25.7, distanceKm: 301 },
  { date: "1 Okt", totalCO2eKg: 30.4, distanceKm: 356 },
  { date: "3 Okt", totalCO2eKg: 34.8, distanceKm: 408 },
  { date: "5 Okt", totalCO2eKg: 27.9, distanceKm: 326 },
  { date: "7 Okt", totalCO2eKg: 26.2, distanceKm: 305 },
  { date: "9 Okt", totalCO2eKg: 29.3, distanceKm: 342 },
];

export interface ModeBreakdown {
  mode: string;
  co2eKg: number;
  shareOfTotal: number;
}

// Tidak menyertakan "Kereta Barang" — Kalimantan belum punya jaringan
// kereta barang aktif, jadi moda ini tidak relevan utk konteks Balikpapan.
// Truk & kapal kargo dominan karena Balikpapan adalah kota pelabuhan dan
// hub darat Kalimantan Timur.
export const emissionByMode: ModeBreakdown[] = [
  { mode: "Truk Diesel", co2eKg: 488, shareOfTotal: 0.58 },
  { mode: "Kapal Kargo", co2eKg: 168, shareOfTotal: 0.20 },
  { mode: "Kargo Udara", co2eKg: 126, shareOfTotal: 0.15 },
  { mode: "Van Listrik", co2eKg: 60, shareOfTotal: 0.07 },
];

export interface ShipmentRow {
  id: string;
  destination: string;
  mode: string | null; // null = belum dicatat — mencerminkan temuan lapangan:
                        // "field moda transportasi belum tercatat konsisten"
  weightKg: number;
  distanceKm: number;
  co2eKg: number | null; // tidak bisa dihitung tanpa moda transportasi
  status: ShipmentStatus;
  eta: string;
  recordedVia: "form" | "buku_dipindah"; // jejak asal data, relevan selama
                                          // masa transisi dari pencatatan manual
}

// Skala realistis UKM ekspedisi (CV Yova / TIKI cabang): puluhan entri per
// hari, bukan ratusan — berbeda dari skema "fleet besar" versi sebelumnya.
export const recentShipments: ShipmentRow[] = [
  { id: "ORD-1012", destination: "Balikpapan Kota (dalam kota)", mode: "Truk Diesel", weightKg: 420, distanceKm: 14, co2eKg: 0.6, status: "delivered", eta: "Terkirim 10:42", recordedVia: "form" },
  { id: "ORD-1011", destination: "Samarinda, Kaltim", mode: "Truk Diesel", weightKg: 1850, distanceKm: 122, co2eKg: 24.1, status: "in_transit", eta: "Hari ini, 16:00", recordedVia: "form" },
  { id: "ORD-1010", destination: "Surabaya, Jawa Timur", mode: null, weightKg: 640, distanceKm: 796, co2eKg: null, status: "in_transit", eta: "11 Okt", recordedVia: "buku_dipindah" },
  { id: "ORD-1009", destination: "Balikpapan Kota (dalam kota)", mode: "Van Listrik", weightKg: 85, distanceKm: 9, co2eKg: 0.03, status: "delivered", eta: "Terkirim 09:15", recordedVia: "form" },
  { id: "ORD-1008", destination: "Banjarmasin, Kalsel", mode: "Kapal Kargo", weightKg: 3100, distanceKm: 310, co2eKg: 7.7, status: "scheduled", eta: "12 Okt", recordedVia: "form" },
  { id: "ORD-1007", destination: "Makassar, Sulsel", mode: null, weightKg: 510, distanceKm: 410, co2eKg: null, status: "delayed", eta: "Tertunda", recordedVia: "buku_dipindah" },
];

// Skala disesuaikan dengan temuan observasi: 2 staf menangani ±40-60
// pesanan/hari di satu cabang — bukan skala perusahaan logistik nasional.
/** Jumlah pesanan yang moda transportasinya belum dicatat. */
export const countMissingMode = (rows: readonly ShipmentRow[]): number =>
  rows.filter((r) => r.mode === null).length;

export const summaryMetrics = {
  ordersToday: 47,
  // Dihitung dari baris yang sama dengan tabel pesanan, supaya angka ini dan tabel selalu cocok.
  ordersMissingMode: countMissingMode(recentShipments),
  totalCO2eThisMonthKg: 842,
  co2eChangePct: -4.1,
  onTimeRatePct: 95.0,
};

// Faktor emisi dipakai bersama oleh form "Catat Pengiriman" untuk estimasi
// real-time — angka sama dengan seed database/timescaledb_... sql (konsisten
// satu sumber kebenaran antara prototipe UI dan skema backend).
export const TRANSPORT_MODES = [
  { code: "truck_diesel", label: "Truk Diesel", factorKgCO2ePerTonKm: 0.107 },
  { code: "van_electric", label: "Van Listrik", factorKgCO2ePerTonKm: 0.045 },
  { code: "ship_cargo", label: "Kapal Kargo", factorKgCO2ePerTonKm: 0.008 },
  { code: "air_freight", label: "Kargo Udara", factorKgCO2ePerTonKm: 0.602 },
  { code: "rail", label: "Kereta Barang", factorKgCO2ePerTonKm: 0.028 },
] as const;
