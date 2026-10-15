import { Search, Bell } from "lucide-react";

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex items-center justify-between border-b border-hairline bg-surface px-6 py-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            placeholder="Cari nomor pengiriman, pelanggan..."
            className="h-9 w-72 rounded-md border border-hairline bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-teal"
          />
        </div>
        <button
          aria-label="Notifikasi"
          className="relative flex h-9 w-9 items-center justify-center rounded-md border border-hairline text-ink-muted hover:bg-surface-sunken"
        >
          <Bell className="h-4 w-4" strokeWidth={2} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-critical" />
        </button>
        <div className="h-9 w-9 rounded-full bg-teal-soft flex items-center justify-center text-sm font-medium text-teal-strong">
          AR
        </div>
      </div>
    </header>
  );
}
