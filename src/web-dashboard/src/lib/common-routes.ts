/**
 * Rute yang sering dipakai admin ekspedisi di Balikpapan (CV Yova, TIKI
 * cabang Balikpapan). Preset ini mengurangi ketikan manual untuk rute
 * berulang — salah satu akar masalah "kelewat nulis" terjadi karena admin
 * mengetik ulang info yang sama berkali-kali saat jam sibuk.
 */
/** Label pilihan untuk tujuan yang jaraknya diisi manual oleh admin. */
export const CUSTOM_ROUTE_LABEL = "Lainnya (isi manual)";

export const COMMON_ROUTES = [
  { label: "Balikpapan Kota (dalam kota)", distanceKm: 12 },
  { label: "Samarinda, Kalimantan Timur", distanceKm: 122 },
  { label: "Banjarmasin, Kalimantan Selatan", distanceKm: 310 },
  { label: "Surabaya, Jawa Timur", distanceKm: 796 },
  { label: "Makassar, Sulawesi Selatan", distanceKm: 410 },
  { label: "Lainnya (isi manual)", distanceKm: null },
] as const;
