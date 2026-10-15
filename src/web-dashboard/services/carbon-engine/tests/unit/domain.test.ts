import { describe, expect, it } from "vitest";
import { CarbonAmount } from "../../src/domain/value-objects/carbon-amount";
import { Distance } from "../../src/domain/value-objects/distance";
import { Weight } from "../../src/domain/value-objects/weight";
import { isFactorActiveOn, type EmissionFactor } from "../../src/domain/entities/emission-factor";
import { calculateEmission, checkWeightPlausibility } from "../../src/domain/services/emission-calculator";
import { ValidationError } from "../../src/domain/errors";
import { SEED_FACTORS, SEED_MODES } from "../../src/infrastructure/persistence/seed-data";

const factor = (modeCode: string) => SEED_FACTORS.find((f) => f.modeCode === modeCode)!;
const mode = (code: string) => SEED_MODES.find((m) => m.code === code)!;

describe("Weight", () => {
  it("menerima berat valid dan mengonversi ke ton", () => {
    expect(Weight.fromKg(1850).toTons()).toBe(1.85);
    expect(Weight.fromKg(0.1).toKg()).toBe(0.1);
  });

  it.each([0, -5, Number.NaN, Number.POSITIVE_INFINITY, 100_000_001])("menolak %s", (v) => {
    expect(() => Weight.fromKg(v)).toThrow(ValidationError);
  });
});

describe("Distance", () => {
  it("menerima jarak valid", () => {
    expect(Distance.fromKm(122).toKm()).toBe(122);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, 40_076])("menolak %s", (v) => {
    expect(() => Distance.fromKm(v)).toThrow(ValidationError);
  });
});

describe("CarbonAmount", () => {
  it("membulatkan ke 4 desimal", () => {
    expect(CarbonAmount.fromKg(1.234567).toKg()).toBe(1.2346);
  });

  it("menolak nilai negatif", () => {
    expect(() => CarbonAmount.fromKg(-0.1)).toThrow(ValidationError);
  });
});

describe("calculateEmission", () => {
  it("berat(ton) × jarak(km) × faktor", () => {
    // 1,85 ton × 122 km × 0,107 = 24,1499
    expect(calculateEmission(Weight.fromKg(1850), Distance.fromKm(122), factor("truck_diesel")).toKg()).toBe(24.1499);
    // 0,42 ton × 14 km × 0,107 = 0,62916
    expect(calculateEmission(Weight.fromKg(420), Distance.fromKm(14), factor("truck_diesel")).toKg()).toBe(0.6292);
    // 3,1 ton × 310 km × 0,008 = 7,688
    expect(calculateEmission(Weight.fromKg(3100), Distance.fromKm(310), factor("ship_cargo")).toKg()).toBe(7.688);
  });

  it("udara lebih tinggi dari truk, truk lebih tinggi dari kapal (beban & jarak sama)", () => {
    const w = Weight.fromKg(1000);
    const d = Distance.fromKm(500);
    const air = calculateEmission(w, d, factor("air_freight")).toKg();
    const truck = calculateEmission(w, d, factor("truck_diesel")).toKg();
    const ship = calculateEmission(w, d, factor("ship_cargo")).toKg();
    expect(air).toBeGreaterThan(truck);
    expect(truck).toBeGreaterThan(ship);
  });

  it("emisi berskala linear terhadap berat", () => {
    const d = Distance.fromKm(100);
    const one = calculateEmission(Weight.fromKg(1000), d, factor("truck_diesel")).toKg();
    const two = calculateEmission(Weight.fromKg(2000), d, factor("truck_diesel")).toKg();
    expect(two).toBeCloseTo(one * 2, 4);
  });
});

describe("checkWeightPlausibility", () => {
  it("memberi peringatan jika berat melebihi kapasitas moda", () => {
    const warnings = checkWeightPlausibility(Weight.fromKg(5000), mode("van_electric"));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.code).toBe("WEIGHT_EXCEEDS_MODE_CAPACITY");
  });

  it("tidak memberi peringatan jika wajar", () => {
    expect(checkWeightPlausibility(Weight.fromKg(500), mode("van_electric"))).toEqual([]);
  });

  it("tidak memberi peringatan jika kapasitas tidak dikenal", () => {
    expect(checkWeightPlausibility(Weight.fromKg(9e7), { code: "x", displayName: "X", maxPayloadKg: null })).toEqual([]);
  });
});

describe("isFactorActiveOn", () => {
  const f: EmissionFactor = {
    ...factor("truck_diesel"),
    validFrom: new Date("2025-01-01T00:00:00Z"),
    validTo: new Date("2026-01-01T00:00:00Z"),
  };

  it("batas awal inklusif, batas akhir eksklusif", () => {
    expect(isFactorActiveOn(f, new Date("2024-12-31T23:59:59Z"))).toBe(false);
    expect(isFactorActiveOn(f, new Date("2025-01-01T00:00:00Z"))).toBe(true);
    expect(isFactorActiveOn(f, new Date("2025-12-31T23:59:59Z"))).toBe(true);
    expect(isFactorActiveOn(f, new Date("2026-01-01T00:00:00Z"))).toBe(false);
  });
});
