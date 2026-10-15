# Rencana Kerja

**Waktu mulai:**
10 Oktober 2026
**Batas akhir pengumpulan:**
15 Oktober 2026

| No | Langkah | Penanggung jawab | Cara memeriksa bahwa langkah ini selesai | Estimasi waktu | Waktu sebenarnya | Status |
|---|---|---|---|---|---|---|
| 1 | Scaffolding: buat struktur proyek (Next.js, Tailwind, sidebar dan topbar, halaman Ringkasan kosong) | [Hairuddin] | Proyek bisa dibuka di browser. `npm install` dan `npm run dev` berjalan, lalu http://localhost:3000 menampilkan sidebar dengan menu Ringkasan, Catat Pengiriman, Riwayat Pengiriman, dan Laporan Emisi | 45 menit | | Kode selesai, menu sidebar diuji otomatis, belum dicek di browser |
| 2 | Alur inti: form Catat Pengiriman dengan validasi, daftar rute umum, daftar moda, dan rumus estimasi emisi | [Kenzi] | Mengosongkan form lalu klik catat menampilkan pesan kesalahan. Mengisi Samarinda, 1850 kg, Truk Diesel menampilkan estimasi 24,15 kg CO2e. Setelah dicatat, entri muncul di "Tercatat hari ini" | 60 menit | | Kode selesai, diuji otomatis (validasi, estimasi 24,15, mencatat), belum dicek di browser |
| 3 | Halaman Ringkasan: empat metrik, grafik tren emisi, emisi per moda, tabel pesanan terbaru (memakai data contoh) | [Rafa Rizki] | Halaman `/overview` menampilkan keempat metrik, grafik, daftar emisi per moda, dan tabel enam pesanan | 45 menit | | Kode selesai, metrik dan data diuji otomatis (grafik belum), belum dicek di browser |
| 4 | Riwayat Pengiriman dan penanda pesanan yang moda transportasinya belum dicatat | [Kenzi] | Di `/shipments`, baris tanpa moda tampil dengan tulisan "Belum dicatat" dan latar berwarna, kolom CO2e berisi tanda "—" | 30 menit | | Kode selesai, diuji otomatis, belum dicek di browser |
| 5 | Laporan Emisi bulanan dengan tombol unduh CSV | [Kenzi] | Klik "Unduh laporan (CSV)" menghasilkan file `laporan-emisi-oktober-2026.csv` yang bisa dibuka di Excel, berisi satu baris judul dan 15 baris data | 45 menit | | Kode selesai, pembuatan file diuji otomatis (belum dicoba di Excel), belum dicek di browser |
| | Bug Hunt | [Kenzi] | Catatan bug dan test selesai | 60 menit | | Belum |
| | Change request | [Rafa Rizki] | Semua kasus uji lama dan baru lulus | 60 menit (perkiraan, sesuaikan setelah change request diumumkan) | | Belum |
| | Dokumentasi dan refleksi | [Alya] | README bisa diikuti orang lain | 60 menit | | Belum |

## Catatan

**Usulan pembagian hari** (sesuaikan dengan ketersediaan tim):

| Tanggal | Rencana |
|---|---|
| 10 sampai 11 Oktober | Langkah 1 sampai 5 diperiksa langsung di browser, lalu hasil pemeriksaan dicatat di kolom "Waktu sebenarnya" dan "Status" |
| 12 Oktober | Bug Hunt |
| 13 Oktober | Change request |
| 14 Oktober | Dokumentasi dan refleksi (tangkapan layar di `docs/bukti/`, README dicoba di komputer yang bersih) |
| 15 Oktober | Cadangan waktu dan pengumpulan |

**Temuan yang sudah diketahui sebelum Bug Hunt**

Sudah diperbaiki dan dijaga test otomatis:

- Angka "Moda belum dicatat" di Ringkasan (sebelumnya 6) tidak sama dengan jumlah baris tanpa moda di tabel (2). Sekarang dihitung dari baris yang sama, hasilnya 2.
- Estimasi emisi di form tidak muncul sebelum referensi pesanan diisi, sehingga pemeriksaan langkah 2 (Samarinda, 1850 kg, Truk Diesel) gagal. Sekarang estimasi hanya menunggu tujuan, berat, dan moda. Referensi pesanan tetap wajib untuk mencatat.
- Berat 0 memunculkan gelembung peringatan bawaan browser, bukan pesan di bawah kolom. Form sekarang memakai `noValidate`.
- Label kolom form tidak terhubung ke inputnya, sehingga pembaca layar tidak bisa membacanya. Sekarang terhubung.
- Unit test: ada 51 test di folder `tes/` (rumus emisi, validasi form, konsistensi data contoh, CSV, form, tabel, metrik, sidebar). Jalankan dengan `npm test`. Rumus emisi sudah diuji dengan angka yang sama dengan Carbon Engine.

Masih terbuka (perlu diperbaiki atau dicatat sebagai batasan):

- Entri dari form Catat Pengiriman hanya tersimpan di memori browser. Entri itu belum muncul di Riwayat Pengiriman dan Laporan Emisi, dan hilang saat halaman di-refresh.
- Menu Pengaturan di sidebar mengarah ke halaman yang belum ada.
- Kolom pencarian dan ikon notifikasi di topbar belum berfungsi.
- Langkah 1 sampai 5 belum dicek di browser sungguhan. Test otomatis berjalan di jsdom, bukan di browser, dan grafik (Recharts) belum diuji.
- File CSV memakai koma sebagai pemisah dan titik sebagai desimal. Excel dengan pengaturan regional Indonesia kemungkinan memakai titik koma, sehingga file bisa terbuka dalam satu kolom. Perlu dicoba di Excel.
