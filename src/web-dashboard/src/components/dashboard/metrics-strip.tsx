import { ArrowDownRight, ArrowUpRight, AlertTriangle } from "lucide-react";
import { formatCO2e, formatNumber } from "@/lib/utils";
import type { summaryMetrics } from "@/lib/mock-data";

/**
 * Strip metrik bergaya panel instrumen. Empat angka dipilih langsung dari
 * temuan lapangan, bukan metrik "vanity" dashboard enterprise:
 * - Pesanan hari ini: angka yang paling sering dicek Bu L. sepanjang hari
 * - Belum ada moda: akar masalah "data tidak bisa ditelusuri ke pengiriman
 *   tertentu" dari POV — sengaja dibuat MENONJOL (bukan disembunyikan)
 *   supaya admin langsung tahu entri mana yang perlu dilengkapi.
 * - Emisi bulan ini: untuk direkap Bu Y. ke mitra korporat (Scope 3)
 * - Ketepatan waktu: indikator operasional dasar
 */
export function MetricsStrip({ metrics }: { metrics: typeof summaryMetrics }) {
  const co2eImproving = metrics.co2eChangePct < 0;
  const hasMissingMode = metrics.ordersMissingMode > 0;

  return (
    <div className="grid grid-cols-4 divide-x divide-hairline border-b border-hairline bg-surface">
      <Metric label="Pesanan hari ini" value={formatNumber(metrics.ordersToday)} />

      <Metric
        label="Moda belum dicatat"
        value={String(metrics.ordersMissingMode)}
        valueClassName={hasMissingMode ? "text-carbon-strong" : "text-ink"}
        trend={
          hasMissingMode ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-carbon-strong">
              <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
              perlu dilengkapi
            </span>
          ) : (
            <span className="text-xs text-positive">semua lengkap</span>
          )
        }
      />

      <Metric
        label="Emisi bulan ini"
        value={formatCO2e(metrics.totalCO2eThisMonthKg)}
        trend={
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${co2eImproving ? "text-positive" : "text-critical"}`}>
            {co2eImproving ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
            {Math.abs(metrics.co2eChangePct)}% vs bulan lalu
          </span>
        }
      />

      <Metric label="Tingkat ketepatan waktu" value={`${metrics.onTimeRatePct}%`} />
    </div>
  );
}

function Metric({
  label,
  value,
  trend,
  valueClassName = "text-ink",
}: {
  label: string;
  value: string;
  trend?: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="px-6 py-5">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className={`mt-1.5 font-display font-semibold tabular ${valueClassName} text-metric-md lg:text-metric-lg`}>
        {value}
      </p>
      {trend && <div className="mt-1.5">{trend}</div>}
    </div>
  );
}
