import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DownloadReportButton } from "@/components/dashboard/download-report-button";
import { MetricsStrip } from "@/components/dashboard/metrics-strip";
import { ShipmentsTable } from "@/components/dashboard/shipments-table";
import { Sidebar } from "@/components/layout/sidebar";
import { emissionTrend30d, recentShipments, summaryMetrics } from "@/lib/mock-data";
import { buildEmissionCsv } from "@/lib/report";

vi.mock("next/navigation", () => ({ usePathname: () => "/overview" }));

describe("Sidebar (langkah 1 rencana)", () => {
  it("menampilkan empat menu utama dengan tautan yang benar", () => {
    render(<Sidebar />);
    const hrefOf = (name: string) => screen.getByRole("link", { name }).getAttribute("href");
    expect(hrefOf("Ringkasan")).toBe("/overview");
    expect(hrefOf("Catat Pengiriman")).toBe("/catat-pengiriman");
    expect(hrefOf("Riwayat Pengiriman")).toBe("/shipments");
    expect(hrefOf("Laporan Emisi")).toBe("/laporan-emisi");
  });

  it("'Pelacakan Kurir' tampil nonaktif berlabel 'Perlu validasi' dan bukan tautan", () => {
    render(<Sidebar />);
    const item = screen.getByText("Pelacakan Kurir");
    expect(item.closest("a")).toBeNull();
    expect(screen.getByText("Perlu validasi")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Pelacakan Kurir/ })).not.toBeInTheDocument();
  });
});

describe("ShipmentsTable (langkah 3 dan 4 rencana)", () => {
  it("menampilkan enam pesanan", () => {
    render(<ShipmentsTable rows={recentShipments} />);
    expect(screen.getAllByRole("row")).toHaveLength(1 + 6); // judul + 6 baris
  });

  it("baris tanpa moda: 'Belum dicatat', latar berwarna, CO2e berupa tanda '—'", () => {
    render(<ShipmentsTable rows={recentShipments} />);
    expect(screen.getAllByText("Belum dicatat")).toHaveLength(2);

    for (const id of ["ORD-1010", "ORD-1007"]) {
      const row = screen.getByText(id).closest("tr")!;
      expect(within(row).getByText("Belum dicatat")).toBeInTheDocument();
      expect(within(row).getByText("—")).toBeInTheDocument();
      expect(row.className).toContain("bg-carbon-soft");
    }
  });

  it("baris lengkap menampilkan moda dan emisi, tanpa penanda", () => {
    render(<ShipmentsTable rows={recentShipments} />);
    const row = screen.getByText("ORD-1011").closest("tr")!;
    expect(within(row).getByText("Truk Diesel")).toBeInTheDocument();
    expect(within(row).getByText("24,1 kg")).toBeInTheDocument();
    expect(within(row).queryByText("Belum dicatat")).not.toBeInTheDocument();
    expect(row.className).not.toContain("bg-carbon-soft");
  });
});

describe("MetricsStrip (langkah 3 rencana)", () => {
  it("menampilkan empat metrik", () => {
    render(<MetricsStrip metrics={summaryMetrics} />);
    for (const label of ["Pesanan hari ini", "Moda belum dicatat", "Emisi bulan ini", "Tingkat ketepatan waktu"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("842,0 kg CO2e")).toBeInTheDocument();
  });

  it("'Moda belum dicatat' bernilai 2, sama dengan jumlah baris bertanda di tabel", () => {
    render(<MetricsStrip metrics={summaryMetrics} />);
    const card = screen.getByText("Moda belum dicatat").parentElement!;
    expect(within(card).getByText("2")).toBeInTheDocument();
    expect(within(card).getByText("perlu dilengkapi")).toBeInTheDocument();
  });

  it("jika semua pesanan lengkap, tampil 'semua lengkap'", () => {
    render(<MetricsStrip metrics={{ ...summaryMetrics, ordersMissingMode: 0 }} />);
    expect(screen.getByText("semua lengkap")).toBeInTheDocument();
  });
});

describe("DownloadReportButton (langkah 5 rencana)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("klik menghasilkan file laporan-emisi-oktober-2026.csv berisi judul + 15 baris", async () => {
    let blob: Blob | undefined;
    URL.createObjectURL = vi.fn((b: Blob) => ((blob = b), "blob:test"));
    URL.revokeObjectURL = vi.fn();
    const downloads: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download);
    });

    render(<DownloadReportButton data={emissionTrend30d} month="Oktober 2026" />);
    await userEvent.setup().click(screen.getByRole("button", { name: /Unduh laporan \(CSV\)/ }));

    expect(downloads).toEqual(["laporan-emisi-oktober-2026.csv"]);
    expect(blob?.type).toBe("text/csv;charset=utf-8;");
    const csv = buildEmissionCsv(emissionTrend30d);
    expect(blob?.size).toBe(new TextEncoder().encode(csv).length);
    expect(csv.split("\n")).toHaveLength(16);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });
});
