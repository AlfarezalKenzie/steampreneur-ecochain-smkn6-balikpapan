import { cn } from "@/lib/utils";

export type ShipmentStatus = "scheduled" | "in_transit" | "delivered" | "delayed" | "cancelled";

const STATUS_CONFIG: Record<ShipmentStatus, { label: string; dot: string; text: string }> = {
  scheduled: { label: "Terjadwal", dot: "bg-ink-faint", text: "text-ink-muted" },
  in_transit: { label: "Dalam perjalanan", dot: "bg-teal", text: "text-teal-strong" },
  delivered: { label: "Terkirim", dot: "bg-positive", text: "text-positive" },
  delayed: { label: "Terlambat", dot: "bg-critical", text: "text-critical" },
  cancelled: { label: "Dibatalkan", dot: "bg-ink-faint", text: "text-ink-faint" },
};

/**
 * Status ditampilkan sebagai dot + label sentence-case, BUKAN badge ALL-CAPS
 * berwarna blok. Lebih tenang untuk tabel padat berisi banyak baris.
 */
export function StatusPill({ status }: { status: ShipmentStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", config.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
