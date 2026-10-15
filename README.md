# EcoChain

EcoChain adalah dashboard web untuk admin ekspedisi skala menengah. Admin mencatat berat, tujuan, dan moda transportasi setiap pengiriman dalam satu form, lalu sistem langsung menghitung estimasi emisi karbon (CO2e) per pengiriman dan menyiapkan rekap bulanan yang bisa diunduh untuk mitra bisnis yang meminta laporan emisi (Scope 3).

Versi ini adalah prototipe. Perhitungan emisi di form berjalan sungguhan, tetapi angka di halaman Ringkasan, Riwayat Pengiriman, dan Laporan Emisi masih data contoh (lihat Batasan yang Diketahui).

## Alur Inti

Alur ini mengikuti pekerjaan admin pengiriman sehari-hari.

1. Buka halaman **Ringkasan** untuk melihat jumlah pesanan hari ini, jumlah pesanan yang moda transportasinya belum dicatat, dan emisi bulan ini.
2. Klik **Catat pengiriman baru** untuk membuka form pencatatan.
3. Isi referensi pesanan, pilih tujuan (jarak terisi otomatis untuk rute umum), isi berat muatan dalam kg, dan pilih moda transportasi. Semua kolom wajib diisi.
4. Periksa panel **Yang akan dicatat** di sisi kanan. Panel ini menampilkan ringkasan isian dan estimasi emisi (kg CO2e) yang diperbarui langsung saat form diisi.
5. Klik **Catat pengiriman ini**. Entri muncul di daftar **Tercatat hari ini** dan form kosong kembali untuk pesanan berikutnya.
6. Buka **Riwayat Pengiriman** untuk melihat daftar pesanan. Pesanan tanpa moda transportasi ditandai agar bisa dilengkapi.
7. Buka **Laporan Emisi** untuk melihat rekap bulanan (tren harian dan emisi per moda), lalu klik **Unduh laporan (CSV)**.

Catatan: pada versi ini entri dari langkah 5 belum muncul di langkah 1, 6, dan 7. Ketiga halaman itu memakai data contoh.

## Cara Menjalankan (How to Run)

Yang wajib dijalankan hanya website. Carbon Engine dan database bersifat opsional dan belum terhubung ke website.

### Prasyarat

- Node.js versi 20.9 atau lebih baru (cek dengan `node -v`)
- npm (ikut terpasang bersama Node.js)
- Koneksi internet saat `npm install`. Font (Space Grotesk, Inter, IBM Plex Mono) diunduh dari Google Fonts oleh Next.js: `npm run dev` tetap berjalan tanpa internet dengan font cadangan, tetapi `npm run build` membutuhkan internet.
- Browser Chrome atau Firefox versi terbaru

### Langkah

1. Clone repositori:
   ```
   git clone https://github.com/AlfarezalKenzie/steampreneur-ecochain-smkn6-balikpapan.git
   ```
2. Masuk ke folder proyek:
   ```
   cd steampreneur-ecochain-smkn6-balikpapan
   ```
3. Install dependensi:
   ```
   npm install
   ```
4. Jalankan website:
   ```
   npm run dev
   ```
5. Buka alamat berikut di browser: http://localhost:3000 (otomatis diarahkan ke halaman Ringkasan)

Untuk versi produksi: `npm run build`, lalu `npm start`.

### Akun atau data contoh

Website ini tidak memerlukan login. Semua angka di halaman Ringkasan, Riwayat Pengiriman, dan Laporan Emisi adalah **data contoh** yang tersimpan di `src/lib/mock-data.ts`, bukan data pengiriman sungguhan.

Untuk mencoba form Catat Pengiriman, Anda bisa memakai isian berikut:

| Kolom | Contoh isian | Estimasi emisi yang diharapkan |
|---|---|---|
| Referensi pesanan | Bpk. Andi, pesanan WA pagi ini | |
| Tujuan | Samarinda, Kalimantan Timur (122 km) | |
| Berat muatan | 1850 | |
| Moda transportasi | Truk Diesel | sekitar 24,15 kg CO2e |

Estimasi muncul setelah tujuan, berat, dan moda terisi. Referensi pesanan tidak memengaruhi angka estimasi, tetapi wajib diisi untuk mencatat.

### Opsional: Carbon Engine dan database PostgreSQL

Carbon Engine adalah backend perhitungan emisi yang berdiri sendiri dan belum dipanggil oleh website. Tanpa database, ia memakai penyimpanan di memori.

1. Pasang PostgreSQL + PostGIS dan jalankan migrasi `database/001` sampai `003` (opsional `004_demo_data.sql`). Langkah lengkapnya, termasuk Docker, ada di [docs/instalasi-database.md](docs/instalasi-database.md).
2. Siapkan dan jalankan service:
   ```
   cd services/carbon-engine
   cp .env.example .env
   npm install
   npm run dev
   ```
   Di Windows, ganti `cp` dengan `copy`. Isi `DATABASE_URL` di `.env` untuk memakai PostgreSQL, atau kosongkan untuk mode memori.
3. Cek: buka http://localhost:4002/health. Hasilnya `{"status":"ok"}`.

Token uji dibuat dengan `npm run dev-token -- ops_manager` (peran lain: `auditor`, `courier`, `admin`). Daftar endpoint, hak akses per peran, dan cara mengujinya ada di [services/carbon-engine/README.md](services/carbon-engine/README.md).

### Jika terjadi masalah

| Masalah | Cara mengatasi |
|---|---|
| Port 3000 sudah dipakai program lain | Jalankan `npm run dev -- -p 3001`, lalu buka http://localhost:3001 |
| Peringatan "Error while requesting resource" untuk `fonts.googleapis.com` di terminal | Komputer tidak terhubung ke internet. Website tetap berjalan dengan font cadangan, hanya tampilan hurufnya berbeda. Sambungkan internet lalu jalankan ulang `npm run dev` untuk font aslinya |
| `npm run build` gagal mengunduh font | Build membutuhkan internet. Sambungkan internet, lalu ulangi |
| `npm install` gagal atau ada pesan versi Node tidak cocok | Cek `node -v`. Perbarui Node.js ke versi 20.9 atau lebih baru |
| Tampilan error setelah berganti versi Node atau memperbarui dependensi | Hapus folder `node_modules` dan `.next`, lalu jalankan `npm install` dan `npm run dev` lagi |
| Entri hilang setelah halaman di-refresh | Memang begitu pada versi ini: entri hanya disimpan di memori browser |
| Menu Pengaturan menampilkan halaman tidak ditemukan | Halaman Pengaturan belum dibuat |
| Masalah pada Carbon Engine atau database | Lihat bagian "Masalah Umum" di [docs/instalasi-database.md](docs/instalasi-database.md) |

## Tangkapan Layar Alur Inti

Gambar disimpan di `docs/bukti/`.

1. Langkah 1, halaman Ringkasan: ![Langkah 1](docs/bukti/langkah-1-ringkasan.png)
2. Langkah 2 dan 3, form Catat Pengiriman terisi: ![Langkah 3](docs/bukti/langkah-3-form-terisi.png)
3. Langkah 4, panel ringkasan dan estimasi emisi: ![Langkah 4](docs/bukti/langkah-4-estimasi-emisi.png)
4. Langkah 5, entri muncul di Tercatat hari ini: ![Langkah 5](docs/bukti/langkah-5-tercatat.png)
5. Langkah 6, Riwayat Pengiriman dengan penanda moda belum dicatat: ![Langkah 6](docs/bukti/langkah-6-riwayat.png)
6. Langkah 7, Laporan Emisi: ![Langkah 7](docs/bukti/langkah-7-laporan.png)

## Cara Menjalankan Pengujian

Pengujian otomatis website (dari folder root):

```
npm test
```

Hasil yang diharapkan: semua test lulus (51 test di 5 berkas pada folder `tes/`). Test berjalan di jsdom (simulasi browser), bukan di browser sungguhan.

| Berkas | Yang diuji |
|---|---|
| `tes/unit/emission.test.ts` | Rumus emisi, termasuk contoh 1.850 kg × 122 km = 24,15 kg |
| `tes/unit/shipment-form.test.ts` | Validasi form dan jarak rute umum |
| `tes/unit/data-and-report.test.ts` | Data contoh cocok dengan rumus, isi dan nama file CSV |
| `tes/components/shipment-entry-form.test.tsx` | Form: pesan kesalahan, jarak manual, estimasi, mencatat entri |
| `tes/components/dashboard-components.test.tsx` | Sidebar, tabel pesanan, metrik, tombol unduh CSV |

Pemeriksaan tambahan:

```
npm run typecheck
npm run build
```

Hasil yang diharapkan: kedua perintah selesai tanpa error. `npm run build` menampilkan lima route (`/`, `/overview`, `/catat-pengiriman`, `/shipments`, `/laporan-emisi`).

![Hasil npm test website: 51 test lulus](docs/bukti/test-dashboard-ringkas.png)

Gambar di atas dirender dari output asli `npm test`, bukan tangkapan layar jendela terminal. Versi rinci ada di `docs/bukti/test-dashboard-rinci.png`.

Carbon Engine (opsional):

```
cd services/carbon-engine
npm install
npm test
```

Hasil yang diharapkan: 66 test lulus dan 5 dilewati (test PostgreSQL). Dengan database yang sudah dimigrasi:

```
TEST_DATABASE_URL=postgres://user:pass@localhost:5432/ecochain npm test
```

Hasil yang diharapkan: 71 test lulus.

Pengujian manual per kasus (U01 sampai U12) ada di [docs/04-kasus-uji.md](docs/04-kasus-uji.md).

## Fitur

Website:

- Form Catat Pengiriman dengan validasi: semua kolom wajib, berat harus lebih dari 0, moda transportasi tidak boleh kosong
- Pilihan rute umum dari Balikpapan dengan jarak terisi otomatis, atau jarak manual untuk tujuan lain
- Panel ringkasan "Yang akan dicatat" sebagai pengecekan ulang sebelum data disimpan
- Estimasi emisi per pengiriman secara langsung, dengan rumus: berat (ton) × jarak (km) × faktor emisi moda (kg CO2e per ton-km)
- Halaman Ringkasan: pesanan hari ini, pesanan tanpa moda, emisi bulan ini, tren emisi, emisi per moda
- Riwayat Pengiriman dengan penanda untuk pesanan yang moda transportasinya belum dicatat
- Laporan Emisi bulanan dengan unduhan CSV yang bisa dibuka di Excel
- Menu Pelacakan Kurir tampil nonaktif berlabel "Perlu validasi"

Carbon Engine (opsional, belum terhubung ke website):

- Perhitungan emisi dengan rumus yang sama, memakai faktor emisi yang berlaku pada tanggal pengiriman
- Peringatan otomatis jika berat melebihi kapasitas umum moda
- Endpoint estimasi, hitung dan simpan, baca hasil, dan rekap per rentang waktu
- Autentikasi JWT dengan pembagian izin per peran, validasi input, dan pembatasan laju permintaan
- Skema PostgreSQL/PostGIS: pengguna, peran dan izin, lokasi, moda transportasi, faktor emisi, pesanan, pengiriman, dan hasil emisi

## Batasan yang Diketahui

- Website belum terhubung ke backend dan database. Backend (Carbon Engine) dan skema database sudah dibuat dan diuji terpisah, tetapi website masih memakai data contoh dan menghitung emisi di browser dengan rumus yang sama.
- Entri dari form Catat Pengiriman hanya disimpan di memori browser dan hilang saat halaman di-refresh. Entri tersebut belum muncul di halaman Riwayat Pengiriman, Ringkasan, maupun Laporan Emisi. File CSV yang diunduh berisi 15 titik data contoh (11 Sep sampai 9 Okt 2026), bukan entri admin.
- Faktor emisi (truk diesel 0,107, van listrik 0,045, kapal kargo 0,008, kargo udara 0,602, kereta barang 0,028 kg CO2e per ton-km) adalah angka ilustratif, belum diverifikasi dengan sumber resmi.
- Jarak pada daftar rute umum adalah perkiraan, belum diverifikasi dengan jarak rute sebenarnya.
- Estimasi ditampilkan dengan 2 desimal, sehingga berat yang sangat kecil (misalnya 0,1 kg pada rute dalam kota) tampil sebagai 0,00 kg CO2e.
- Belum ada login dan pembagian peran pengguna di website.
- Pelacakan Kurir (aplikasi mobile) belum dibangun karena kebutuhannya belum divalidasi lewat wawancara dengan kurir.
- Kolom pencarian dan ikon notifikasi di bagian atas masih tampilan saja. Menu Pengaturan belum memiliki halaman.
- Test otomatis berjalan di jsdom, belum di browser sungguhan. Grafik belum diuji otomatis. File CSV belum dicoba di Excel dengan pengaturan regional Indonesia (pemisah kolom kemungkinan titik koma).
- Carbon Engine: belum ada adapter RabbitMQ (event baru dicatat ke log), token memakai HS256 dengan secret bersama, dan performa belum diukur. Migrasi TimescaleDB (`database/timescaledb_001_sensor_emission_logs.sql`) belum pernah dijalankan dan tidak dibutuhkan aplikasi saat ini.

## Struktur Folder

| File / folder | Isi |
|---|---|
| `docs/` | Dokumen proses kerja: proposal, dokumen output tugas turun lapangan, rancangan arsitektur dan skema database, spesifikasi, rencana, log prompt, kasus uji, dan panduan instalasi database |
| `docs/bukti/` | Tangkapan layar alur inti dan bukti hasil test |
| `src/app/` | Halaman: `overview`, `catat-pengiriman`, `shipments`, `laporan-emisi` |
| `src/components/` | Komponen antarmuka: `layout`, `forms`, `charts`, `dashboard`, `ui` |
| `src/lib/` | Data contoh (`mock-data.ts`), daftar rute umum (`common-routes.ts`), rumus emisi (`emission.ts`), validasi form (`shipment-form.ts`), pembuat CSV (`report.ts`), fungsi bantu (`utils.ts`) |
| `tes/` | Unit test website (`unit/` dan `components/`) |
| `database/` | Migrasi SQL PostgreSQL/PostGIS (001 sampai 004) dan migrasi TimescaleDB (opsional, belum diuji) |
| `services/carbon-engine/` | Backend perhitungan emisi (opsional), dengan README dan test sendiri |
| `tailwind.config.ts` | Warna, font, dan token desain |
| `vitest.config.mts` | Konfigurasi test |

## Link Demo (opsional)

Belum ada.

## Sumber dan Lisensi

Kode ditulis dengan bantuan AI (Claude, Anthropic). Catatan prompt dan keputusan tim ada di [docs/03-log-prompt.md](docs/03-log-prompt.md).

| Nama | Sumber (link) | Lisensi |
|---|---|---|
| Next.js | https://nextjs.org | MIT |
| React | https://react.dev | MIT |
| Tailwind CSS | https://tailwindcss.com | MIT |
| Recharts | https://recharts.org | MIT |
| Lucide (ikon) | https://lucide.dev | ISC |
| class-variance-authority | https://github.com/joe-bell/cva | Apache-2.0 |
| clsx | https://github.com/lukeed/clsx | MIT |
| tailwind-merge | https://github.com/dcastil/tailwind-merge | MIT |
| @tanstack/react-query dan zod (terpasang, belum dipakai di kode website) | https://tanstack.com/query dan https://zod.dev | MIT |
| Vitest | https://vitest.dev | MIT |
| Testing Library | https://testing-library.com | MIT |
| jsdom | https://github.com/jsdom/jsdom | MIT |
| TypeScript | https://www.typescriptlang.org | Apache-2.0 |
| Font Space Grotesk | https://fonts.google.com/specimen/Space+Grotesk | SIL Open Font License 1.1 |
| Font Inter | https://fonts.google.com/specimen/Inter | SIL Open Font License 1.1 |
| Font IBM Plex Mono | https://fonts.google.com/specimen/IBM+Plex+Mono | SIL Open Font License 1.1 |
| Library Carbon Engine (Express, pg, pino, dan lain-lain) | lihat [services/carbon-engine/README.md](services/carbon-engine/README.md) | MIT dan Apache-2.0 |

Faktor emisi dalam aplikasi adalah angka ilustratif buatan tim, bukan angka yang diambil dari DEFRA atau GHG Protocol. Hanya rumusnya (berat dalam ton × jarak × faktor per ton-km) yang mengikuti pendekatan umum berbasis jarak. Data wawancara dan observasi dikumpulkan sendiri oleh tim pada 6 Oktober 2026.

## Tim

| Nama | Peran |
|---|---|
| Alfarezal Kenzie | Navigator utama |
| Muhammad Rafa Rizki | Dokumentator |
| Alya Putri Cahyawati | Analis kebutuhan |
| Hairuddin | Penguji |
