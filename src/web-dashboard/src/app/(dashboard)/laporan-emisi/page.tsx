import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmissionTrendChart } from "@/components/charts/emission-trend-chart";
import { ModeBreakdownList } from "@/components/charts/mode-breakdown";
import { DownloadReportButton } from "@/components/dashboard/download-report-button";
import { emissionTrend30d, emissionByMode, summaryMetrics } from "@/lib/mock-data";
import { formatCO2e } from "@/lib/utils";

/**
 * Halaman ini eksis karena satu alasan spesifik dari wawancara Bu Y.:
 * "Kalau makin banyak klien besar yang minta laporan emisi, kami bisa
 * keteteran." — mitra korporat mulai mensyaratkan laporan emisi Scope 3
 * sebagai syarat kerja sama, dan perhitungan manual tahunan tidak lagi
 * memadai. Halaman ini dibuat SEDERHANA dan bisa diunduh, bukan dashboard
 * analitik yang rumit — sesuai audit kebutuhan: "laporan ringkas yang bisa
 * dicek sewaktu-waktu".
 */
export default function LaporanEmisiPage() {
  const currentMonth = "Oktober 2026";

  return (
    <div className="min-h-screen">
      <Topbar
        title="Laporan Emisi"
        subtitle="Rekap siap dibagikan ke mitra bisnis yang meminta data emisi (Scope 3)"
      />

      <div className="p-6 space-y-5">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Rekap {currentMonth}</CardTitle>
              <p className="mt-0.5 text-xs text-ink-faint">Total emisi dari seluruh pengiriman tercatat bulan ini</p>
            </div>
            <DownloadReportButton data={emissionTrend30d} month={currentMonth} />
          </CardHeader>
          <CardContent>
            <p className="font-display text-metric-lg font-semibold text-ink tabular">
              {formatCO2e(summaryMetrics.totalCO2eThisMonthKg)}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              {summaryMetrics.co2eChangePct < 0 ? "Turun" : "Naik"}{" "}
              {Math.abs(summaryMetrics.co2eChangePct)}% dibanding bulan lalu
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-5">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Tren harian</CardTitle>
            </CardHeader>
            <CardContent>
              <EmissionTrendChart data={emissionTrend30d} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Per moda transportasi</CardTitle>
            </CardHeader>
            <CardContent>
              <ModeBreakdownList data={emissionByMode} />
            </CardContent>
          </Card>
        </div>

        <Card className="border-carbon/30 bg-carbon-soft/30">
          <CardContent className="flex items-start gap-3 py-4">
            <p className="text-sm text-ink">
              <span className="font-medium text-carbon-strong">Catatan metodologi: </span>
              Perhitungan memakai faktor emisi standar (kg CO2e per ton-km) mengikuti pendekatan
              GHG Protocol. Pengiriman yang moda transportasinya belum dicatat tidak termasuk
              dalam total ini — lengkapi di halaman Riwayat Pengiriman agar laporan akurat.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
