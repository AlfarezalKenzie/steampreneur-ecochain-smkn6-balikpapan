import { AlertTriangle } from "lucide-react";
import type { ShipmentRow } from "@/lib/mock-data";
import { StatusPill } from "@/components/ui/status-pill";
import { formatNumber } from "@/lib/utils";

export function ShipmentsTable({ rows }: { rows: ShipmentRow[] }) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-hairline text-xs text-ink-muted">
          <th className="px-5 py-3 font-medium">ID Pesanan</th>
          <th className="px-5 py-3 font-medium">Tujuan</th>
          <th className="px-5 py-3 font-medium">Moda</th>
          <th className="px-5 py-3 font-medium text-right">Berat</th>
          <th className="px-5 py-3 font-medium text-right">Jarak</th>
          <th className="px-5 py-3 font-medium text-right">CO2e</th>
          <th className="px-5 py-3 font-medium">Status</th>
          <th className="px-5 py-3 font-medium">ETA</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const missingMode = row.mode === null;
          return (
            <tr
              key={row.id}
              className={missingMode ? "border-b border-hairline bg-carbon-soft/40 last:border-0" : "border-b border-hairline last:border-0 hover:bg-surface-sunken/60"}
            >
              <td className="px-5 py-3 font-mono text-xs text-ink">{row.id}</td>
              <td className="px-5 py-3 text-sm text-ink">{row.destination}</td>
              <td className="px-5 py-3 text-sm">
                {missingMode ? (
                  <span className="inline-flex items-center gap-1.5 text-carbon-strong">
                    <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
                    Belum dicatat
                  </span>
                ) : (
                  <span className="text-ink-muted">{row.mode}</span>
                )}
              </td>
              <td className="px-5 py-3 text-right font-mono text-xs text-ink-muted tabular">
                {formatNumber(row.weightKg)} kg
              </td>
              <td className="px-5 py-3 text-right font-mono text-xs text-ink-muted tabular">
                {formatNumber(row.distanceKm)} km
              </td>
              <td className="px-5 py-3 text-right font-mono text-xs tabular">
                {row.co2eKg === null ? (
                  <span className="text-ink-faint">—</span>
                ) : (
                  <span className="text-carbon">{formatNumber(row.co2eKg, 1)} kg</span>
                )}
              </td>
              <td className="px-5 py-3">
                <StatusPill status={row.status} />
              </td>
              <td className="px-5 py-3 text-sm text-ink-muted">{row.eta}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
