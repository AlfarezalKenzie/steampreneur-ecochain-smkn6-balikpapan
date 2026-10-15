import Link from "next/link";
import { PackagePlus } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { MetricsStrip } from "@/components/dashboard/metrics-strip";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmissionTrendChart } from "@/components/charts/emission-trend-chart";
import { ModeBreakdownList } from "@/components/charts/mode-breakdown";
import { ShipmentsTable } from "@/components/dashboard/shipments-table";
import {
  summaryMetrics,
  emissionTrend30d,
  emissionByMode,
  recentShipments,
} from "@/lib/mock-data";

export default function OverviewPage() {
  return (
    <div className="min-h-screen">
      <Topbar
        title="Ringkasan"
        subtitle="Rekap harian & bulanan — bukan laporan rumit, cukup dicek sekilas"
      />

      <MetricsStrip metrics={summaryMetrics} />

      {/* Aksi utama ditempatkan paling menonjol, persis di bawah metrik,
          karena ini tugas yang dilakukan admin 40-60x/hari (lihat observasi
          lapangan). Tombol ini sengaja BUKAN di dalam kartu/menu tersembunyi. */}
      <div className="flex items-center justify-between border-b border-hairline bg-surface-sunken/50 px-6 py-3.5">
        <p className="text-sm text-ink-muted">
          Ada pesanan baru masuk? Catat berat, tujuan, dan moda dalam satu langkah.
        </p>
        <Link href="/catat-pengiriman">
          <Button variant="teal" size="md">
            <PackagePlus className="h-4 w-4" strokeWidth={2.25} />
            Catat pengiriman baru
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-5 p-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Tren emisi 15 hari terakhir</CardTitle>
            <span className="text-xs text-ink-faint">kg CO2e / hari</span>
          </CardHeader>
          <CardContent>
            <EmissionTrendChart data={emissionTrend30d} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emisi per moda</CardTitle>
          </CardHeader>
          <CardContent>
            <ModeBreakdownList data={emissionByMode} />
          </CardContent>
        </Card>
      </div>

      <div className="px-6 pb-6">
        <Card>
          <CardHeader>
            <CardTitle>Pesanan terbaru</CardTitle>
            <Link href="/shipments" className="text-sm text-teal hover:text-teal-strong">
              Lihat semua
            </Link>
          </CardHeader>
          <ShipmentsTable rows={recentShipments} />
        </Card>
      </div>
    </div>
  );
}
