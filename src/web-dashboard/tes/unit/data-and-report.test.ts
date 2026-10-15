import { describe, expect, it } from "vitest";
import { estimateCO2eKg } from "@/lib/emission";
import {
  TRANSPORT_MODES,
  countMissingMode,
  emissionByMode,
  emissionTrend30d,
  recentShipments,
  summaryMetrics,
} from "@/lib/mock-data";
import { buildEmissionCsv, reportFileName } from "@/lib/report";
import { formatCO2e, formatNumber } from "@/lib/utils";

describe("konsistensi data contoh", () => {
  it("emisi tiap pesanan contoh cocok dengan rumus (toleransi pembulatan 0,05 kg)", () => {
    for (const row of recentShipments) {
      if (row.mode === null) {
        expect(row.co2eKg, `${row.id} tanpa moda tidak boleh punya emisi`).toBeNull();
        continue;
      }
      const mode = TRANSPORT_MODES.find((m) => m.label === row.mode);
      expect(mode, `${row.id}: moda "${row.mode}" tidak dikenal`).toBeDefined();
      const expected = estimateCO2eKg(row.weightKg, row.distanceKm, mode!.factorKgCO2ePerTonKm);
      expect(Math.abs((row.co2eKg ?? NaN) - expected), row.id).toBeLessThanOrEqual(0.05);
    }
  });

  it("angka 'Moda belum dicatat' di Ringkasan sama dengan jumlah baris tanpa moda di tabel", () => {
    expect(countMissingMode(recentShipments)).toBe(2);
    expect(summaryMetrics.ordersMissingMode).toBe(countMissingMode(recentShipments));
  });

  it("rincian per moda berjumlah total bulan ini, pangsa berjumlah 100%", () => {
    const sumKg = emissionByMode.reduce((s, m) => s + m.co2eKg, 0);
    const sumShare = emissionByMode.reduce((s, m) => s + m.shareOfTotal, 0);
    expect(sumKg).toBe(summaryMetrics.totalCO2eThisMonthKg);
    expect(sumShare).toBeCloseTo(1, 5);
  });

  it("tren harian berisi 15 titik", () => {
    expect(emissionTrend30d).toHaveLength(15);
  });

  it("enam pesanan contoh, ID unik", () => {
    expect(recentShipments).toHaveLength(6);
    expect(new Set(recentShipments.map((r) => r.id)).size).toBe(6);
  });
});

describe("laporan CSV", () => {
  it("satu baris judul dan 15 baris data", () => {
    const lines = buildEmissionCsv(emissionTrend30d).split("\n");
    expect(lines[0]).toBe("Tanggal,Total CO2e (kg),Jarak (km)");
    expect(lines).toHaveLength(16);
    expect(lines[1]).toBe("11 Sep,26.4,312");
    expect(lines[15]).toBe("9 Okt,29.3,342");
  });

  it("nama file mengikuti bulan laporan", () => {
    expect(reportFileName("Oktober 2026")).toBe("laporan-emisi-oktober-2026.csv");
  });
});

describe("format angka", () => {
  it("memakai pemisah desimal koma ala Indonesia", () => {
    expect(formatNumber(24.1499, 2)).toBe("24,15");
    expect(formatNumber(1850)).toBe("1.850");
  });
  it("kg di bawah 1.000, ton mulai 1.000 kg", () => {
    expect(formatCO2e(842)).toBe("842,0 kg CO2e");
    expect(formatCO2e(999.9)).toBe("999,9 kg CO2e");
    expect(formatCO2e(1000)).toBe("1,0 ton CO2e");
    expect(formatCO2e(1500)).toBe("1,5 ton CO2e");
  });
});
