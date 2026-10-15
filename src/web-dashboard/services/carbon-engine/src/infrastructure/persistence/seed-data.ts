import type { EmissionFactor } from "../../domain/entities/emission-factor";
import type { TransportMode } from "../../domain/entities/transport-mode";

/**
 * Data awal untuk mode in-memory (pengembangan lokal & test). Nilainya sengaja
 * sama dengan database/003_rbac_seed.sql. Angka faktor bersifat ILUSTRATIF:
 * ganti dengan angka resmi GHG Protocol/DEFRA/KLHK sebelum dipakai melaporkan emisi.
 */
export const SEED_MODES: readonly TransportMode[] = [
  { code: "truck_diesel", displayName: "Truk Diesel", maxPayloadKg: 8_000 },
  { code: "van_electric", displayName: "Van Listrik", maxPayloadKg: 1_200 },
  { code: "ship_cargo", displayName: "Kapal Kargo", maxPayloadKg: 50_000_000 },
  { code: "air_freight", displayName: "Kargo Udara", maxPayloadKg: 30_000 },
  { code: "rail", displayName: "Kereta Barang", maxPayloadKg: 2_000_000 },
];

const SOURCE = "DEFRA 2024 (ilustratif)";
const FROM = new Date("2024-01-01T00:00:00Z");

export const SEED_FACTORS: readonly EmissionFactor[] = [
  { id: "00000000-0000-4000-8000-000000000001", modeCode: "truck_diesel", kgCo2ePerTonKm: 0.107, source: SOURCE, validFrom: FROM, validTo: null },
  { id: "00000000-0000-4000-8000-000000000002", modeCode: "van_electric", kgCo2ePerTonKm: 0.045, source: SOURCE, validFrom: FROM, validTo: null },
  { id: "00000000-0000-4000-8000-000000000003", modeCode: "ship_cargo", kgCo2ePerTonKm: 0.008, source: SOURCE, validFrom: FROM, validTo: null },
  { id: "00000000-0000-4000-8000-000000000004", modeCode: "air_freight", kgCo2ePerTonKm: 0.602, source: SOURCE, validFrom: FROM, validTo: null },
  { id: "00000000-0000-4000-8000-000000000005", modeCode: "rail", kgCo2ePerTonKm: 0.028, source: SOURCE, validFrom: FROM, validTo: null },
];
