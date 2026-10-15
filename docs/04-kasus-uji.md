# Kasus Uji

Bagian A diisi **sebelum** mulai membangun. Hasil yang diharapkan dihitung sendiri oleh tim (boleh dengan kalkulator), bukan oleh AI.
Bagian B diisi setelah aplikasi diuji.

Rumus dan faktor emisi ada di `01-spesifikasi.md` bagian 6. Hasil yang diharapkan yang berupa angka ditandai `[hitung sendiri]` dan harus diisi oleh tim.

| ID | Kriteria yang diuji | Langkah / input | Hasil yang diharapkan | Hasil sebenarnya | Lulus? | Bukti (nama file tangkapan layar) |
|---|---|---|---|---|---|---|
| U01 | Estimasi emisi dihitung benar untuk rute umum dan moda truk | Buka Catat Pengiriman. Referensi: Uji A. Tujuan: Samarinda, Kalimantan Timur. Berat: 800. Moda: Truk Diesel. Klik "Catat pengiriman ini" | Panel menampilkan estimasi `1.24` kg CO2e sebelum diklik. Setelah diklik, entri tercatat dengan angka yang sama dan form kosong kembali | 10.44|ya | |
| U02 | Estimasi emisi memakai faktor yang sesuai moda | Referensi: Uji B. Tujuan: Banjarmasin, Kalimantan Selatan. Berat: 500. Moda: Kapal Kargo. Klik catat | Estimasi `1.24` kg CO2e, entri tercatat | 1,24|ya | |
| U03 | Estimasi emisi dengan jarak manual | Referensi: Uji C. Tujuan: Lainnya (isi manual). Jarak: 250. Berat: 1200. Moda: Truk Diesel. Klik catat | Kolom jarak muncul. Estimasi `1.25` kg CO2e, entri tercatat |1.25 |ya | |
| U04 | Input salah: semua kolom kosong | Buka Catat Pengiriman, biarkan semua kolom kosong, klik catat | Tidak ada entri tercatat. Pesan kesalahan muncul di bawah setiap kolom wajib | | | |
| U05 | Input salah: moda transportasi tidak dipilih | Isi referensi, tujuan Samarinda, berat 800. Biarkan moda kosong. Klik catat | Tidak ada entri tercatat. Pesan bahwa moda wajib dipilih muncul | | ya| |
| U06 | Input salah: berat negatif | Isi semua kolom dengan benar, tetapi berat: -50. Klik catat | Tidak ada entri tercatat | | | |
| U07 | Input salah: huruf di kolom angka | Ketik "abc" di kolom berat, isi kolom lain dengan benar. Klik catat | Huruf tidak diterima sebagai berat. Tidak ada entri tercatat | | ya| |
| U08 | Batas aturan: berat tepat 0 | Isi semua kolom dengan benar, berat: 0. Klik catat | Ditolak, karena berat harus lebih dari 0 kg. Tidak ada entri tercatat | |ya | |
| U09 | Batas aturan: berat sedikit di atas 0 | Tujuan: Balikpapan Kota (dalam kota). Berat: 0,1. Moda: Truk Diesel. Klik catat | Diterima dan tercatat, karena berat lebih dari 0. Estimasi `[hitung sendiri]` kg CO2e | |ya | |
| U10 | Batas aturan: jarak manual tepat 0 | Tujuan: Lainnya (isi manual). Jarak: 0. Isi kolom lain dengan benar. Klik catat | Ditolak, karena jarak harus lebih dari 0 km. Tidak ada entri tercatat | | ya| |
| U11 | Pesanan tanpa moda ditandai | Buka Riwayat Pengiriman. Perhatikan baris yang modanya kosong | Baris itu ditandai "Belum dicatat" dan kolom CO2e tidak berisi angka | | ya| |
| U12 | Unduh laporan emisi | Buka Laporan Emisi, klik "Unduh laporan (CSV)", buka file hasil unduhan | File bernama `laporan-emisi-oktober-2026.csv`, berisi satu baris judul dan satu baris data untuk setiap titik pada grafik tren (`[hitung sendiri]` jumlahnya dari grafik) | |ya | |

Wajib ada:
- minimal satu kasus dengan **input yang salah**: U04, U05, U06, U07.
- minimal satu kasus **di batas aturan**: U08, U09, U10.

Saran penamaan bukti: simpan tangkapan layar di `docs/bukti/` dengan nama sesuai ID, misalnya `u01.png`.

## Unit test otomatis (jika ada)
Nama file test:
- `tes/unit/emission.test.ts`
- `tes/unit/shipment-form.test.ts`
- `tes/unit/data-and-report.test.ts`
- `tes/components/shipment-entry-form.test.tsx`
- `tes/components/dashboard-components.test.tsx`

Jumlah test: 51. Jalankan dengan `npm test`. Pada 11 Oktober 2026 semuanya lulus. Test berjalan di jsdom (simulasi browser), jadi tidak menggantikan pengujian manual di browser untuk Bagian B.

Test otomatis yang terkait dengan kasus uji di atas:

| Kasus | Test otomatis terkait |
|---|---|
| U04 | `shipment-entry-form.test.tsx`: form kosong lalu klik catat menampilkan pesan kesalahan di keempat kolom dan tidak mencatat |
| U05 | `shipment-form.test.ts`: validasi menolak moda kosong |
| U06, U07, U08 | `shipment-form.test.ts`: berat 0, negatif, huruf, dan spasi ditolak. `shipment-entry-form.test.tsx`: berat 0 menampilkan pesan di bawah kolom |
| U10 | `shipment-form.test.ts` dan `shipment-entry-form.test.tsx`: jarak manual kosong, 0, atau negatif ditolak |
| U11 | `dashboard-components.test.tsx`: dua baris tanpa moda ditandai "Belum dicatat" dan CO2e berisi tanda "—" |
| U12 | `data-and-report.test.ts` dan `dashboard-components.test.tsx`: nama file dan isi CSV, tombol unduh |

U01, U02, U03, dan U09 belum punya test otomatis dengan input yang persis sama. Rumus emisi diuji dengan input lain di `emission.test.ts`.
