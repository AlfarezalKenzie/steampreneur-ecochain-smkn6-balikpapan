# Analisis Change Request

Isi bagian ini **sebelum** mengubah kode, lalu commit dan push (contoh pesan: `dokumen: analisis change request`). Juri memeriksa bahwa commit ini muncul sebelum commit perubahan kode.

**Change request:** pencarian, filter, dan ekspor CSV (lihat Tugas 3 di lembar challenge).

**Kriteria penerimaan yang akan dipenuhi dan cara kami memenuhinya:**

Rumusan di bawah adalah rumusan tim berdasarkan ringkasan Tugas 3 (pencarian, filter, dan ekspor CSV). Cocokkan dengan kalimat asli di lembar challenge sebelum commit. Perubahan dilakukan pada halaman **Riwayat Pengiriman** (`/shipments`), karena di sanalah daftar pesanan berada.

| No | Kriteria | Cara kami memenuhinya |
|---|---|---|
| K1 | Pengguna dapat mencari pesanan dengan mengetik kata kunci, tanpa membedakan huruf besar dan kecil | Kolom pencarian di atas tabel, memakai fungsi murni `filterShipments` yang mencari di ID, tujuan, dan moda |
| K2 | Pengguna dapat menyaring pesanan berdasarkan moda transportasi (termasuk yang belum dicatat) dan berdasarkan status | Dua pilihan filter di atas tabel. Pencarian dan kedua filter berlaku bersamaan (semua syarat harus terpenuhi) |
| K3 | Pengguna dapat mengunduh hasil yang sedang tampil sebagai CSV yang bisa dibuka di Excel | Tombol "Ekspor CSV" mengunduh `riwayat-pengiriman.csv` berisi baris yang sedang tampil, dengan sel berkoma diberi tanda kutip |
| K4 | Keadaan khusus ditangani: tidak ada hasil, input aneh, spasi | Pesan "Tidak ada pesanan yang cocok", tombol ekspor nonaktif saat 0 baris, spasi di awal dan akhir diabaikan, karakter khusus tidak merusak halaman |
| K5 | Fitur lama tetap berfungsi | Semua kasus uji lama (U01 sampai U12) dan 51 test otomatis tetap dijalankan dan harus lulus |

## 1. Dampak
| Bagian yang terdampak | File / fungsi | Perubahan yang diperlukan |
|---|---|---|
| Spesifikasi | `docs/01-spesifikasi.md` bagian 4 (Fitur wajib) | Tambah fitur 5: pencarian, filter moda dan status, dan ekspor CSV hasil di Riwayat Pengiriman |
| Spesifikasi | bagian 5 (Di luar cakupan) | Tambah: pencarian dan filter hanya mencakup data contoh, belum mencakup entri dari form Catat Pengiriman. Pencarian global di topbar tidak diaktifkan |
| Spesifikasi | bagian 6 (Aturan bisnis) | Tambah aturan: pencarian tidak membedakan huruf besar dan kecil pada ID, tujuan, dan moda. Spasi di awal dan akhir diabaikan. Pencarian dan filter berlaku bersamaan. Ekspor memuat baris yang sedang tampil. Sel CSV berisi koma, tanda kutip, atau baris baru diberi tanda kutip |
| Spesifikasi | bagian 7 (Data yang disimpan) | Tambah: file `riwayat-pengiriman.csv` dibuat di browser saat tombol diklik. Kata kunci dan pilihan filter hanya di memori dan tidak disimpan |
| Spesifikasi | bagian 8 (Kriteria selesai) | Tambah kriteria centang untuk U13 sampai U22 |
| Kode | `src/app/(dashboard)/shipments/page.tsx` | Tetap komponen server. Ganti `<ShipmentsTable rows={recentShipments} />` dengan `<ShipmentsExplorer rows={recentShipments} />` |
| Kode | `src/components/dashboard/shipments-explorer.tsx` (baru, `"use client"`) | Menyimpan kata kunci, filter moda, dan filter status. Menampilkan toolbar (pencarian, dua filter, tombol "Atur ulang"), teks "Menampilkan X dari Y pesanan", tabel, pesan tanpa hasil, dan tombol "Ekspor CSV" (nonaktif jika 0 baris). Memakai `Field`, `Input`, dan `Select` yang sudah ada agar label terhubung ke input |
| Kode | `src/lib/shipment-filter.ts` (baru) | Fungsi murni `filterShipments(rows, { query, mode, status })` dan konstanta untuk opsi "Belum dicatat". Dibuat murni agar mudah diuji |
| Kode | `src/lib/report.ts` | Tambah `escapeCsvCell` (tanda kutip untuk sel berkoma, kutip, atau baris baru; kutip ganda digandakan; sel diawali `=`, `+`, `-`, atau `@` diberi awalan agar tidak dibaca Excel sebagai rumus), `buildShipmentsCsv(rows)`, dan `shipmentsFileName()`. `buildEmissionCsv` ikut memakai `escapeCsvCell`; hasilnya untuk data sekarang tidak berubah |
| Kode | `src/lib/download.ts` (baru) dan `src/components/dashboard/download-report-button.tsx` | Pindahkan logika unduh (Blob, tautan, `click`) menjadi `downloadCsv(content, fileName)`. `DownloadReportButton` memakainya dengan properti yang sama (`data`, `month`) supaya test lama tetap lulus |
| Kode | `src/components/ui/status-pill.tsx` | Ekspor label status agar opsi filter dan isi CSV memakai teks yang sama dengan tabel. Tampilan tidak berubah |
| Kode | `src/components/dashboard/shipments-table.tsx`, `src/components/layout/topbar.tsx` | Tidak diubah. Tabel sudah menerima `rows`. Kolom pencarian global di topbar tetap tidak berfungsi (dicatat di README) |
| Kasus uji / test | `docs/04-kasus-uji.md` | Tambah U13 sampai U22 (bagian 2 di bawah), dalam commit yang sama dengan dokumen ini, sebelum kode |
| Kasus uji / test | `tes/unit/shipment-filter.test.ts` (baru) | Pencarian, setiap filter, gabungan, spasi, tanpa hasil |
| Kasus uji / test | `tes/unit/data-and-report.test.ts` | Tambah test `escapeCsvCell` dan `buildShipmentsCsv` (8 kolom per baris, sel berkoma diberi kutip, moda dan CO2e kosong). Test `buildEmissionCsv` yang lama harus tetap lulus |
| Kasus uji / test | `tes/components/shipments-explorer.test.tsx` (baru) | Mengetik pencarian, memilih filter, pesan tanpa hasil, atur ulang, tombol ekspor (nama file, jumlah baris, nonaktif saat kosong) |
| Kasus uji / test | `tes/components/dashboard-components.test.tsx` | Tidak diubah. Test `DownloadReportButton` di dalamnya menjaga bahwa refactor unduh tidak merusak Laporan Emisi |
| README | Bagian Alur Inti | Tambah langkah mencari, menyaring, dan mengekspor di Riwayat Pengiriman (setelah langkah 6) |
| README | Bagian Fitur | Tambah pencarian, filter, dan ekspor CSV Riwayat |
| README | Bagian Cara Menjalankan Pengujian | Perbarui jumlah test dan tabel berkas test (dua berkas baru) |
| README | Bagian Batasan yang Diketahui | Tambah: pencarian dan filter hanya mencakup data contoh. Pencarian di topbar belum berfungsi. CSV riwayat belum dicoba di Excel dengan pengaturan regional Indonesia |
| README | Bagian Struktur Folder | Tambah `shipment-filter.ts`, `download.ts`, dan komponen `shipments-explorer.tsx` |
| Dokumen proses | `docs/03-log-prompt.md`, `docs/02-rencana.md` | Tambah baris prompt change request dan perbarui status baris "Change request" |

## 2. Kasus uji baru

ID melanjutkan dari U12 di `docs/04-kasus-uji.md`. Hasil yang diharapkan dibaca dari data contoh di `src/lib/mock-data.ts` (enam pesanan: ORD-1007 sampai ORD-1012) dan dari aturan di atas, bukan dari kode yang belum ditulis. Tim sebaiknya memeriksanya sendiri terhadap data sebelum commit.

| ID | Langkah / input | Hasil yang diharapkan |
|---|---|---|
| U13 | Buka Riwayat Pengiriman. Ketik `samarinda` (huruf kecil) di kolom pencarian | Tabel menampilkan 1 baris: ORD-1011. Teks "Menampilkan 1 dari 6 pesanan" muncul |
| U14 | Ketik `1009` di kolom pencarian | 1 baris: ORD-1009 (pencarian juga mencakup ID) |
| U15 | Ketik `balikpapan`, lalu pilih filter moda `Van Listrik` | 1 baris: ORD-1009. Dengan `balikpapan` saja tanpa filter moda, tampil 2 baris (ORD-1012 dan ORD-1009) |
| U16 | Pilih filter moda `Belum dicatat` | 2 baris: ORD-1010 dan ORD-1007, keduanya bertanda "Belum dicatat" |
| U17 | Pilih filter status `Terlambat` | 1 baris: ORD-1007 |
| U18 (input salah) | Ketik `xyz`. Lalu ganti dengan karakter khusus satu per satu: `"`, `,`, `<b>` | Setiap kali: 0 baris, pesan "Tidak ada pesanan yang cocok", halaman tidak error, tombol "Ekspor CSV" nonaktif |
| U19 (batas) | Ketik ` samarinda ` dengan spasi di awal dan akhir. Lalu hapus dan ketik hanya spasi | Spasi di awal dan akhir diabaikan: 1 baris (ORD-1011). Hanya spasi diperlakukan sebagai kosong: 6 baris |
| U20 | Dengan pencarian dan filter aktif, klik "Atur ulang" | Kolom pencarian kosong, kedua filter kembali ke "Semua", 6 baris tampil |
| U21 | Pilih filter moda `Truk Diesel`, klik "Ekspor CSV", buka file hasil unduhan | File `riwayat-pengiriman.csv` berisi 1 baris judul dan 2 baris data (ORD-1012 dan ORD-1011). Setiap baris terbaca sebagai 8 kolom. "Samarinda, Kaltim" dan "Hari ini, 16:00" diberi tanda kutip karena berisi koma |
| U22 | Tanpa filter, klik "Ekspor CSV", buka file hasil unduhan | 1 baris judul dan 6 baris data. Pada baris ORD-1010 dan ORD-1007, kolom Moda berisi "Belum dicatat" dan kolom CO2e kosong. Setiap baris terbaca sebagai 8 kolom |

Kasus uji lama U01 sampai U12 dijalankan ulang sebagai pemeriksaan regresi.

## Asumsi dan risiko

- **Lembar challenge belum saya lihat.** Kriteria K1 sampai K5 adalah rumusan dari ringkasan "pencarian, filter, dan ekspor CSV". Jika lembar challenge menyebut hal yang berbeda (misalnya filter berdasarkan tanggal, atau ekspor di Laporan Emisi), perbarui bagian ini sebelum commit.
- **Entri dari form belum masuk ke Riwayat Pengiriman.** Rencana ini hanya mencakup data contoh. Akibatnya entri yang baru dicatat tidak bisa dicari. Alternatifnya, entri disimpan di state bersama sehingga tampil di Riwayat. Itu menambah pekerjaan dan menyentuh halaman lain, jadi tidak dimasukkan ke change request ini. Jika juri menguji "catat pesanan lalu cari", fitur ini akan gagal. Putuskan sebelum mulai.
- **CSV harus memberi tanda kutip.** Empat dari enam tujuan dan sebagian ETA berisi koma. Tanpa `escapeCsvCell`, kolom bergeser. Itu sebabnya U21 dan U22 memeriksa jumlah kolom.
- **Awalan rumus.** Sel yang diawali `=`, `+`, `-`, atau `@` bisa dijalankan sebagai rumus oleh Excel. Data contoh tidak mengandungnya, tetapi isian pengguna nanti bisa.
- **Excel pengaturan regional Indonesia** kemungkinan memakai titik koma sebagai pemisah kolom, sama seperti catatan pada CSV Laporan Emisi. Format CSV riwayat mengikuti format yang sudah ada agar konsisten, dan perlu dicoba di Excel milik tim.
- **Kolom pencarian di topbar** ("Cari nomor pengiriman, pelanggan...") sudah ada tetapi tidak berfungsi. Dengan pencarian baru di halaman Riwayat, pengguna bisa mengira keduanya sama. Pertimbangkan menonaktifkannya (lihat `06-catatan-review.md` No. 6).

## 3. Setelah selesai
- [ok] Kasus uji lama tetap lulus
- [ok] Kasus uji baru lulus
- [ok] Spesifikasi diperbarui
- [ok] README diperbarui
