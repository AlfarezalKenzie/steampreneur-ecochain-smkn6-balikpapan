import { describe, expect, it } from "vitest";
import { COMMON_ROUTES, CUSTOM_ROUTE_LABEL } from "@/lib/common-routes";
import { EMPTY_FORM, canEstimate, parseWeightKg, resolveDistanceKm, validateShipmentForm, type FormState } from "@/lib/shipment-form";

const valid: FormState = {
  customerRef: "Bpk. Andi",
  routeLabel: "Samarinda, Kalimantan Timur",
  distanceKm: "",
  weightKg: "1850",
  modeCode: "truck_diesel",
};

describe("validateShipmentForm", () => {
  it("form kosong: keempat kolom wajib menampilkan pesan", () => {
    const e = validateShipmentForm(EMPTY_FORM);
    expect(Object.keys(e).sort()).toEqual(["customerRef", "modeCode", "routeLabel", "weightKg"]);
  });

  it("isian valid tidak menghasilkan error", () => {
    expect(validateShipmentForm(valid)).toEqual({});
  });

  it.each(["0", "-5", "abc", " ", "Infinity"])("berat %j ditolak", (w) => {
    expect(validateShipmentForm({ ...valid, weightKg: w }).weightKg).toBe("Berat harus lebih dari 0 kg.");
  });

  it("referensi pesanan berisi spasi saja dianggap kosong", () => {
    expect(validateShipmentForm({ ...valid, customerRef: "   " }).customerRef).toBeDefined();
  });

  it("tujuan 'Lainnya' mewajibkan jarak lebih dari 0", () => {
    const base = { ...valid, routeLabel: CUSTOM_ROUTE_LABEL };
    expect(validateShipmentForm({ ...base, distanceKm: "" }).distanceKm).toBeDefined();
    expect(validateShipmentForm({ ...base, distanceKm: "0" }).distanceKm).toBeDefined();
    expect(validateShipmentForm({ ...base, distanceKm: "-3" }).distanceKm).toBeDefined();
    expect(validateShipmentForm({ ...base, distanceKm: "250" })).toEqual({});
  });

  it("tujuan rute umum tidak meminta jarak manual", () => {
    expect(validateShipmentForm(valid).distanceKm).toBeUndefined();
  });
});

describe("resolveDistanceKm / parseWeightKg", () => {
  it("memakai jarak rute umum", () => {
    expect(resolveDistanceKm(valid)).toBe(122);
  });
  it("memakai jarak manual untuk 'Lainnya'", () => {
    expect(resolveDistanceKm({ ...valid, routeLabel: CUSTOM_ROUTE_LABEL, distanceKm: "250" })).toBe(250);
  });
  it("null bila belum valid", () => {
    expect(resolveDistanceKm(EMPTY_FORM)).toBeNull();
    expect(resolveDistanceKm({ ...valid, routeLabel: CUSTOM_ROUTE_LABEL })).toBeNull();
    expect(parseWeightKg(EMPTY_FORM)).toBeNull();
    expect(parseWeightKg(valid)).toBe(1850);
  });
});

describe("canEstimate", () => {
  it("estimasi tidak menunggu referensi pesanan (pemeriksaan langkah 2 di rencana)", () => {
    const e = validateShipmentForm({ ...valid, customerRef: "" });
    expect(e.customerRef).toBeDefined(); // tetap wajib untuk mencatat
    expect(canEstimate(e)).toBe(true); // tetapi tidak menahan estimasi
  });
  it("estimasi menunggu tujuan, berat, dan moda", () => {
    expect(canEstimate(validateShipmentForm({ ...valid, weightKg: "" }))).toBe(false);
    expect(canEstimate(validateShipmentForm({ ...valid, modeCode: "" }))).toBe(false);
    expect(canEstimate(validateShipmentForm({ ...valid, routeLabel: "" }))).toBe(false);
  });
});

describe("daftar rute umum", () => {
  it("jarak rute umum sesuai spesifikasi dan hanya 'Lainnya' tanpa jarak", () => {
    const byLabel = Object.fromEntries(COMMON_ROUTES.map((r) => [r.label, r.distanceKm]));
    expect(byLabel["Samarinda, Kalimantan Timur"]).toBe(122);
    expect(byLabel["Banjarmasin, Kalimantan Selatan"]).toBe(310);
    expect(byLabel["Makassar, Sulawesi Selatan"]).toBe(410);
    expect(byLabel["Surabaya, Jawa Timur"]).toBe(796);
    expect(byLabel["Balikpapan Kota (dalam kota)"]).toBe(12);
    expect(COMMON_ROUTES.filter((r) => r.distanceKm === null).map((r) => r.label)).toEqual([CUSTOM_ROUTE_LABEL]);
  });
});
