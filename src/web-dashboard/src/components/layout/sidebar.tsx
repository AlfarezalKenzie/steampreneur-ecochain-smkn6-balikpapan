"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  PackagePlus,
  Package,
  FileBarChart,
  Truck,
  Settings,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Urutan & label menu disusun ulang berdasarkan bukti lapangan (lihat
// Dokumen Output Tugas Turun Lapangan, 6 Okt 2026) — bukan struktur menu
// dashboard enterprise generik. "Catat Pengiriman" ditempatkan di posisi
// paling atas karena itu tugas yang dilakukan admin 40-60x/hari.
const NAV_ITEMS = [
  { href: "/overview", label: "Ringkasan", icon: LayoutGrid },
  { href: "/catat-pengiriman", label: "Catat Pengiriman", icon: PackagePlus },
  { href: "/shipments", label: "Riwayat Pengiriman", icon: Package },
  { href: "/laporan-emisi", label: "Laporan Emisi", icon: FileBarChart },
];

// Fitur dengan status "Perlu validasi lanjutan" di tabel audit — ditampilkan
// tapi ditandai jelas, BUKAN dibangun penuh sebagai halaman fungsional,
// supaya tidak over-build sebelum ada wawancara kurir.
const PENDING_VALIDATION_ITEM = {
  href: "/fleet-routes",
  label: "Pelacakan Kurir",
  icon: Truck,
  badge: "Perlu validasi",
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-ink text-white">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal">
          <Boxes className="h-4.5 w-4.5 text-white" strokeWidth={2.25} />
        </div>
        <span className="font-display text-lg font-semibold tracking-tight">EcoChain</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/60 hover:bg-white/5 hover:text-white/90"
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}

        {/* Fitur belum tervalidasi — dibuat non-interaktif & diberi badge,
            bukan di-skip total, agar tim tetap ingat fitur ini ada di
            roadmap tapi menunggu wawancara kurir sebelum didesain detail. */}
        <div
          className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-white/35"
          title="Menunggu wawancara validasi dengan kurir lapangan"
        >
          <PENDING_VALIDATION_ITEM.icon className="h-4 w-4" strokeWidth={2} />
          <span className="flex-1">{PENDING_VALIDATION_ITEM.label}</span>
          <span className="rounded-sm bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">
            {PENDING_VALIDATION_ITEM.badge}
          </span>
        </div>
      </nav>

      <div className="border-t border-white/10 px-3 py-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white/90"
        >
          <Settings className="h-4 w-4" strokeWidth={2} />
          Pengaturan
        </Link>
      </div>
    </aside>
  );
}
