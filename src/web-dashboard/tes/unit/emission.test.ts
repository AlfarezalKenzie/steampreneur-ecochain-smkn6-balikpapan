import { describe, expect, it } from "vitest";
import { estimateCO2eKg } from "@/lib/emission";
import { TRANSPORT_MODES } from "@/lib/mock-data";

const factor = (code: string) => TRANSPORT_MODES.find((m) => m.code === code)!.factorKgCO2ePerTonKm;

describe("estimateCO2eKg (rumus inti)", () => {
  it("contoh di spesifikasi: 1.850 kg, 122 km, Truk Diesel = 24,15 kg", () => {
    const v = estimateCO2eKg(1850, 122, factor("truck_diesel"));
    expect(v).toBe(24.1499);
    expect(v.toFixed(2)).toBe("24.15");
  });

  // Vektor yang sama dengan test Carbon Engine: angka form dan server harus identik.
  it.each([
    [420, 14, "truck_diesel", 0.6292],
    [3100, 310, "ship_cargo", 7.688],
    [1000, 100, "truck_diesel", 10.7],
    [1000, 500, "air_freight", 301],
  ])("%s kg x %s km (%s) = %s kg CO2e", (kg, km, mode, expected) => {
    expect(estimateCO2eKg(kg, km, factor(mode))).toBe(expected);
  });

  it("berskala linear terhadap berat dan jarak", () => {
    const base = estimateCO2eKg(1000, 100, factor("truck_diesel"));
    expect(estimateCO2eKg(2000, 100, factor("truck_diesel"))).toBeCloseTo(base * 2, 4);
    expect(estimateCO2eKg(1000, 200, factor("truck_diesel"))).toBeCloseTo(base * 2, 4);
  });

  it("urutan emisi: udara > truk > kapal untuk beban dan jarak sama", () => {
    const e = (m: string) => estimateCO2eKg(1000, 500, factor(m));
    expect(e("air_freight")).toBeGreaterThan(e("truck_diesel"));
    expect(e("truck_diesel")).toBeGreaterThan(e("ship_cargo"));
  });
});
