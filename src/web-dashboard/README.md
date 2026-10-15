# EcoChain Web Dashboard

Shell dashboard Next.js (App Router) untuk platform Smart Supply Chain & Carbon Footprint Tracking.

## Stack
- **Next.js 16.4** (App Router, Turbopack) + **React 19.3**
- **Tailwind CSS 3** dengan design token kustom (lihat `tailwind.config.ts`) — bukan palet default
- **Recharts 3** untuk visualisasi data
- Pola komponen ala **shadcn/ui** (`class-variance-authority` + `tailwind-merge`), siap diperluas dengan `npx shadcn@latest add <component>`

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000 — akan redirect otomatis ke `/overview`.

> **Catatan:** proyek ini memakai `next/font/google` (Space Grotesk, Inter, IBM Plex Mono) yang di-fetch saat build/dev pertama kali. Pastikan mesin Anda punya akses internet ke `fonts.googleapis.com`. Untuk lingkungan tanpa akses internet (mis. CI/CD tertutup, sandbox offline), ganti ke `next/font/local` dengan file font yang di-self-host.

## Dasar Desain: Bukti Lapangan

Prioritas halaman disusun dari *Dokumen Output Tugas Turun Lapangan* (6 Okt 2026: 2 wawancara + 1 observasi di CV Yova & TIKI Balikpapan), bukan dari asumsi dashboard enterprise.

| Halaman | Dasar kebutuhan | Status audit |
|---|---|---|
| `/catat-pengiriman` | Salah catat berat saat ramai; tidak ada pengecekan ulang; moda transportasi tidak konsisten | Terbukti, perlu disesuaikan |
| `/laporan-emisi` | Tekanan laporan Scope 3 dari mitra korporat | Terbukti dibutuhkan (bukti terkuat) |
| `/overview` | Butuh ringkasan harian/bulanan yang bisa dicek sekilas | Terbukti dibutuhkan |
| `/shipments` | Menandai pesanan yang datanya belum lengkap | Pendukung |
| Pelacakan Kurir | Kurir belum diwawancara | **Perlu validasi lanjutan: sengaja tidak dibangun** |

## Struktur Halaman

```
src/app/(dashboard)/
├── overview/            # Ringkasan harian/bulanan + aksi cepat
├── catat-pengiriman/    # Form: validasi, moda wajib, estimasi emisi real-time
├── shipments/           # Riwayat; entri tanpa moda ditandai
└── laporan-emisi/       # Rekap bulanan + unduh CSV (berfungsi, client-side)
```

Form `catat-pengiriman` menyimpan entri hanya di state browser (hilang saat refresh) karena backend belum ada. Seluruh angka di `src/lib/mock-data.ts` adalah data contoh, bukan data nyata.

## Integrasi Backend

`next.config.mjs` sudah berisi rewrite proxy ke Service A & B untuk pengembangan lokal:

```
/api/core/*    → http://localhost:4001  (Service A — Supply Chain)
/api/carbon/*  → http://localhost:4002  (Service B — Carbon Engine)
```

Saat ini dashboard masih memakai data mock (`src/lib/mock-data.ts`). Ganti dengan pemanggilan API nyata (disarankan `@tanstack/react-query`, sudah terpasang di `package.json`) begitu endpoint backend tersedia.

## Catatan Desain

Lihat komentar di `tailwind.config.ts`, `components/ui/card.tsx`, dan `components/dashboard/metrics-strip.tsx` untuk rasional keputusan desain (kenapa border bukan shadow, kenapa bar list bukan pie chart, dll).

## Cara Menjalankan Pengujian

```bash
npm test
```

Hasil yang diharapkan: 51 test lulus (5 file di folder `tes/`). Test berjalan di jsdom (Vitest + Testing Library), bukan di browser sungguhan.

| File | Yang diuji |
|---|---|
| `tes/unit/emission.test.ts` | Rumus emisi, termasuk contoh 1.850 kg x 122 km = 24,15 kg, dengan angka yang sama dengan Carbon Engine |
| `tes/unit/shipment-form.test.ts` | Validasi form, jarak rute umum, estimasi tidak menunggu referensi pesanan |
| `tes/unit/data-and-report.test.ts` | Data contoh cocok dengan rumus, angka Ringkasan sama dengan tabel, isi dan nama file CSV |
| `tes/components/shipment-entry-form.test.tsx` | Form: pesan kesalahan, kolom jarak manual, estimasi, panel ringkasan, mencatat entri |
| `tes/components/dashboard-components.test.tsx` | Sidebar, tabel pesanan (penanda "Belum dicatat"), metrik, tombol unduh CSV |

Cek tipe dan build: `npm run typecheck` dan `npm run build`.

## Batasan yang Diketahui

- Entri dari form hanya di memori browser dan belum masuk ke Riwayat, Ringkasan, atau Laporan Emisi.
- Semua angka di Ringkasan, Riwayat, dan Laporan adalah data contoh (`src/lib/mock-data.ts`).
- Menu Pengaturan, kolom pencarian, dan ikon notifikasi belum berfungsi.
- Grafik belum diuji otomatis; belum dicek di browser sungguhan.
- CSV belum dicoba di Excel dengan pengaturan regional Indonesia.
