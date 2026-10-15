import { describe, expect, it } from "vitest";
import { buildUseCases } from "../../src/composition";
import type { EmissionFactor } from "../../src/domain/entities/emission-factor";
import {
  EmissionFactorNotFoundError,
  EmissionRecordNotFoundError,
  UnknownTransportModeError,
  ValidationError,
} from "../../src/domain/errors";
import { SEED_FACTORS } from "../../src/infrastructure/persistence/seed-data";
import { buildMemoryRepos, fixedClock, NOW, SpyPublisher } from "../helpers";

const SHIPMENT_A = "11111111-1111-4111-8111-111111111111";
const SHIPMENT_B = "22222222-2222-4222-8222-222222222222";

function setup(factors?: readonly EmissionFactor[]) {
  const publisher = new SpyPublisher();
  const repos = buildMemoryRepos(factors);
  return { publisher, uc: buildUseCases(repos, publisher, fixedClock) };
}

describe("EstimateEmission", () => {
  it("memakai faktor yang berlaku pada TANGGAL PENGIRIMAN, bukan faktor terbaru", async () => {
    const truck = SEED_FACTORS.find((f) => f.modeCode === "truck_diesel")!;
    const v1: EmissionFactor = { ...truck, id: "v1", kgCo2ePerTonKm: 0.107, validTo: new Date("2026-01-01T00:00:00Z") };
    const v2: EmissionFactor = { ...truck, id: "v2", kgCo2ePerTonKm: 0.1, validFrom: new Date("2026-01-01T00:00:00Z"), validTo: null };
    const { uc } = setup([v1, v2]);
    const input = { modeCode: "truck_diesel", weightKg: 1000, distanceKm: 100 };

    const old = await uc.estimate.execute({ ...input, shipmentDate: new Date("2025-06-01T00:00:00Z") });
    const recent = await uc.estimate.execute({ ...input, shipmentDate: new Date("2026-06-01T00:00:00Z") });

    expect(old.emissionFactorId).toBe("v1");
    expect(old.totalCo2eKg).toBe(10.7);
    expect(recent.emissionFactorId).toBe("v2");
    expect(recent.totalCo2eKg).toBe(10);
  });

  it("memakai tanggal sekarang jika shipmentDate tidak diberikan", async () => {
    const { uc } = setup();
    const r = await uc.estimate.execute({ modeCode: "truck_diesel", weightKg: 1850, distanceKm: 122 });
    expect(r.totalCo2eKg).toBe(24.1499);
    expect(r.factorSource).toContain("DEFRA");
  });

  it("menolak moda tidak dikenal", async () => {
    const { uc } = setup();
    await expect(uc.estimate.execute({ modeCode: "hovercraft", weightKg: 1, distanceKm: 1 })).rejects.toBeInstanceOf(UnknownTransportModeError);
  });

  it("gagal jelas bila tidak ada faktor pada tanggal tersebut", async () => {
    const { uc } = setup();
    await expect(
      uc.estimate.execute({ modeCode: "truck_diesel", weightKg: 1, distanceKm: 1, shipmentDate: new Date("2023-06-01T00:00:00Z") }),
    ).rejects.toBeInstanceOf(EmissionFactorNotFoundError);
  });

  it("tetap menghitung tapi memberi peringatan bila berat melebihi kapasitas moda", async () => {
    const { uc } = setup();
    const r = await uc.estimate.execute({ modeCode: "van_electric", weightKg: 5000, distanceKm: 10 });
    expect(r.totalCo2eKg).toBeGreaterThan(0);
    expect(r.warnings.map((w) => w.code)).toContain("WEIGHT_EXCEEDS_MODE_CAPACITY");
  });

  it("menolak input tidak valid lewat value object", async () => {
    const { uc } = setup();
    await expect(uc.estimate.execute({ modeCode: "truck_diesel", weightKg: -1, distanceKm: 10 })).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("CalculateShipmentEmission", () => {
  it("menyimpan hasil dan menerbitkan event emission.calculated", async () => {
    const { uc, publisher } = setup();
    const r = await uc.calculate.execute({ shipmentId: SHIPMENT_A, modeCode: "truck_diesel", weightKg: 1850, distanceKm: 122 });

    expect(r.calculatedAt).toEqual(NOW);
    const stored = await uc.getShipmentEmission.execute(SHIPMENT_A);
    expect(stored.totalCo2eKg).toBe(24.1499);
    expect(publisher.events).toHaveLength(1);
    expect(publisher.events[0]).toMatchObject({ name: "emission.calculated", payload: { shipmentId: SHIPMENT_A, totalCo2eKg: 24.1499 } });
  });

  it("idempoten: menghitung ulang menimpa hasil lama, bukan menggandakan", async () => {
    const { uc } = setup();
    await uc.calculate.execute({ shipmentId: SHIPMENT_A, modeCode: "truck_diesel", weightKg: 1000, distanceKm: 100 });
    await uc.calculate.execute({ shipmentId: SHIPMENT_A, modeCode: "truck_diesel", weightKg: 2000, distanceKm: 100 });

    expect((await uc.getShipmentEmission.execute(SHIPMENT_A)).totalCo2eKg).toBe(21.4);
    const summary = await uc.getSummary.execute(new Date("2026-10-01T00:00:00Z"), new Date("2026-11-01T00:00:00Z"));
    expect(summary.shipmentCount).toBe(1);
  });

  it("tidak menyimpan maupun menerbitkan event jika perhitungan gagal", async () => {
    const { uc, publisher } = setup();
    await expect(uc.calculate.execute({ shipmentId: SHIPMENT_A, modeCode: "hovercraft", weightKg: 1, distanceKm: 1 })).rejects.toThrow();
    await expect(uc.getShipmentEmission.execute(SHIPMENT_A)).rejects.toBeInstanceOf(EmissionRecordNotFoundError);
    expect(publisher.events).toHaveLength(0);
  });
});

describe("GetEmissionSummary", () => {
  it("merekap total dan per moda, urut dari emisi terbesar", async () => {
    const { uc } = setup();
    await uc.calculate.execute({ shipmentId: SHIPMENT_A, modeCode: "truck_diesel", weightKg: 1850, distanceKm: 122 }); // 24,1499
    await uc.calculate.execute({ shipmentId: SHIPMENT_B, modeCode: "ship_cargo", weightKg: 3100, distanceKm: 310 }); // 7,688

    const s = await uc.getSummary.execute(new Date("2026-10-01T00:00:00Z"), new Date("2026-11-01T00:00:00Z"));
    expect(s.shipmentCount).toBe(2);
    expect(s.totalCo2eKg).toBe(31.8379);
    expect(s.byMode.map((m) => m.modeCode)).toEqual(["truck_diesel", "ship_cargo"]);
  });

  it("rentang setengah-terbuka: batas akhir tidak ikut dihitung", async () => {
    const { uc } = setup();
    await uc.calculate.execute({ shipmentId: SHIPMENT_A, modeCode: "truck_diesel", weightKg: 1000, distanceKm: 100, shipmentDate: new Date("2026-10-31T16:00:00Z") });
    const inRange = await uc.getSummary.execute(new Date("2026-10-01T00:00:00Z"), new Date("2026-10-31T16:00:00.001Z"));
    const atBoundary = await uc.getSummary.execute(new Date("2026-10-01T00:00:00Z"), new Date("2026-10-31T16:00:00Z"));
    expect(inRange.shipmentCount).toBe(1);
    expect(atBoundary.shipmentCount).toBe(0);
  });

  it("menolak rentang terbalik dan rentang terlalu lebar", async () => {
    const { uc } = setup();
    const d = (s: string) => new Date(s);
    await expect(Promise.resolve().then(() => uc.getSummary.execute(d("2026-11-01T00:00:00Z"), d("2026-10-01T00:00:00Z")))).rejects.toBeInstanceOf(ValidationError);
    await expect(Promise.resolve().then(() => uc.getSummary.execute(d("2024-01-01T00:00:00Z"), d("2026-01-01T00:00:00Z")))).rejects.toBeInstanceOf(ValidationError);
  });
});
