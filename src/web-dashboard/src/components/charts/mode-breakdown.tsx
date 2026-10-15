import type { ModeBreakdown } from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";

/**
 * Breakdown emisi per moda sebagai horizontal bar list, bukan pie/donut chart.
 * Untuk 5 kategori dengan perbandingan nilai, bar lebih mudah dibaca secara
 * presisi dibanding sudut pada pie chart — pilihan fungsional, bukan estetika semata.
 */
export function ModeBreakdownList({ data }: { data: ModeBreakdown[] }) {
  const max = Math.max(...data.map((d) => d.co2eKg));

  return (
    <div className="space-y-3.5">
      {data.map((row) => (
        <div key={row.mode}>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-sm text-ink">{row.mode}</span>
            <span className="font-mono text-xs text-ink-muted">
              {formatNumber(row.co2eKg)} kg · {Math.round(row.shareOfTotal * 100)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-sunken">
            <div
              className="h-1.5 rounded-full bg-teal"
              style={{ width: `${(row.co2eKg / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
