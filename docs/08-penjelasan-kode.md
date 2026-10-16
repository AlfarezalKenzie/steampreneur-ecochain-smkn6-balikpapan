# Penjelasan Kode

Tidak ada sesi presentasi, jadi dokumen ini adalah bukti utama bahwa tim memahami kode yang dihasilkan AI.

Aturan:
- Setiap anggota menjelaskan **minimal dua bagian kode yang berbeda**. Bagian yang dijelaskan tidak boleh sama dengan anggota lain.
- Tulis dengan bahasa sendiri. Boleh bertanya ke AI untuk memahami, tetapi jangan menyalin jawabannya.
- Sebut nama file dan fungsi yang nyata, serta contoh nilai yang nyata.
- Jika memungkinkan, setiap anggota meng-commit bagiannya sendiri dari akun GitHub masing-masing.

---

## Bagian A: Penjelasan per anggota

### Penjelasan 1
- **Ditulis oleh:*Rafa*
- **File dan fungsi:*app\(dashboard)\catat-pengiriman\page.tsx, membuat komponen top bar sebagai header, dan ShipmentEntryForm sebagai formulir input data pengiriman.*
- **Apa yang dilakukan:*Menampilkan judul halaman dan formulir untuk memasukkan data pengiriman*
- **Kenapa dibuat seperti ini:*Agar ketika melakukan pemasukan data, bisa terlihat di top bar atau bagian atas suatu halaman web*
- **Contoh:** jika inputnya ShipmentEntryForm bisa memvalidasi data yang akan dimasukkan, maka sistem dapat menampilkan pesan kesalahan dan meminta pengguna untuk mengisi ulang data tersebut.
- **Jika input salah atau kosong:*Pada kode halaman ini, validasi input tidak keliatan karena halaman nya hanya memanggil komponen formulir ShipmentEntryForm tanpa melakukan validasi *

### Penjelasan 2
- **Ditulis oleh:*Rafa*
- **File dan fungsi:*app\(dasboard)\shipments\page.tsx, berfungsi menampilkan halaman riwayat pengiriman, dan juga membuat informasi kelengkapan data dan tabel daftar pengiriman*
- **Apa yang dilakukan:*sistem melakukan perhitungan jumlah pesanan yang belum memiliki mooda trasnportasi dengan melalui fugnsi kode recentShipments.filter((s) => s.mode === null, jika ada data yang tidak lengkap, halaman menampilkan pesan bahwa semua pesanan sudah lengkap dan nantinya data yang sudah di input akan ditampilkan di ShipmentsTable tepatnya di dalam Card)*
- **Kenapa dibuat seperti ini:*agar pengguna dapat melihat riwayat pengiriman dan mengetahui apakah ada pesanan yang belum lengkap datanya*
- **Contoh:*jika terdapat 3 pesanan dengan nilai mode berupa null, halaman menampilkan pesan “3 pesanan belum lengkap datanya, perlu dilengkapi agar masuk laporan emisi"*
- **Jika input salah atau kosong:*Jika input salah atau kosong, kode ini hanya memeriksa apakah moda transportasi bernilai null. Input kosong atau lain sebagainya belum diperiksa pada kode ini.*

### Penjelasan 3
- **Ditulis oleh:*Kenzie*
- **File dan fungsi:*component\charts\emmision-trade-chart.tsx, menampilkan grafik perubahan emisi karbon berdasarkan data tanggal dan jumlah emisi yang tecatat pada platform.*
- **Apa yang dilakukan:*Menggunakan fungsi-fungsi seperti membuat dan menampilkan grafik emisi, penyesuaian ukuran grafik, dan lainnya dalam memenuhi kebutuhan penyajian data emisi. *
- **Kenapa dibuat seperti ini:*Untuk memudahkan pengguna dalam mendapatkan gambaran data yang disajikan dalam bentuk grafik.*
- **Contoh:*Function EmissionTrendChart membantu dalam membentuk grafik dengan menerima data sebagai input, kemudian menggunakannya untuk menampilkan grafik.*
- **Jika input salah atau kosong:*Grafik tidak dapat terbentuk dengan sempurna atau tidak tepat karena function tersebut mengandung peletakan atau tata letak seperti garis, bentuk grafik, dan sebagainya.*

### Penjelasan 4
- **Ditulis oleh:*Kenzie*
- **File dan fungsi:*forms\shipment-entry-form.tsx, memasukkan catatan pengiriman dan memeriksa data.*
- **Apa yang dilakukan:*melakukan pencatatan hasil dari perhitungan emisi, pemeriksaan data, dan masukan pengiriman *
- **Kenapa dibuat seperti ini:*Agar proses pencatatan lebih praktis, mengurangi kesalahan input manual, dan membantu admin mengetahui estimasi emisi setiap pengiriman tanpa menghitungnya secara manual.*
- **Contoh:*Form terdiri dari nama pelanggan, tujuan pengiriman, berat muatan, dan moda transportasi. Seluruh form dapat diisi untuk melakukan pencatatan dan menjalankan proses perhitungan emisi.*
- **Jika input salah atau kosong:*Proses pencatatan tidak akan berjalan karena form perlu diisi untuk melakukan pencatatan*

### Penjelasan 5
- **Ditulis oleh:*Alya*
- **File dan fungsi:*src/lib/emission.ts, fungsi calculateShipmentEmission untuk menghitung estimasi emisi karbon (CO_2e) dari suatu pengiriman.*
- **Apa yang dilakukan:*Menghitung total emisi CO_2e berdasarkan perkalian berat muatan, jarak tempuh pengiriman, dan faktor emisi spesifik dari moda transportasi yang dipilih (darat, laut, udara, atau kereta).*
- **Kenapa dibuat seperti ini:*Logika perhitungan emisi dipisahkan ke dalam modul helper/lib agar bersifat modular, mudah diuji dengan unit test, serta dapat digunakan kembali (reusable) di berbagai komponen seperti formulir pencatatan maupun laporan emisi.*
- **Contoh:*Jika pengiriman memiliki berat 5 ton, jarak 200 km, dan menggunakan truk darat dengan faktor emisi 0.12 kgCO2e/ton-km, fungsi mengembalikan hasil 5 × 200 × 0.12 = 120 kgCO2e.*
- **Jika input salah atau kosong:*Jika berat atau jarak bernilai 0, negatif, atau moda transportasi bernilai null, fungsi mengembalikan nilai 0 untuk mencegah kesalahan kalkulasi (NaN) pada tampilan dashboard.*

### Penjelasan 6
- **Ditulis oleh:*Alya*
- **File dan fungsi:*src/components/dashboard/metrics-strip.tsx, komponen MetricsStrip yang menampilkan ringkasan kartu indikator emisi (metric cards).*
- **Apa yang dilakukan:*Menerima data agregat statistik emisi lalu merendernya menjadi kartu ringkasan indikator seperti Total Emisi, Rata-rata Emisi per Pengiriman, dan Persentase Perubahan Emisi dibanding bulan sebelumnya.*
- **Kenapa dibuat seperti ini:*Untuk memberikan gambaran cepat (high-level overview) kepada pengguna atau pihak manajemen mengenai performa emisi perusahaan secara visual di bagian atas dashboard tanpa harus membaca seluruh baris data pada tabel.*
- **Contoh:*Menampilkan kartu "Total Emisi Bulan Ini" dengan angka 14.5 ton CO2e beserta status tren penurunan 8% dibanding bulan lalu.*
- **Jika input salah atau kosong:*Jika data transaksi belum ada atau bernilai null, komponen akan menampilkan angka $0$ atau tanda strip (-) agar tata letak card tetap rapi dan antarmuka pengguna tidak mengalami error.*

(Tambahkan sampai setiap anggota punya minimal dua penjelasan.)

---

## Bagian B: Pertanyaan yang dijawab bersama

1. Jika aturan bisnis utama di spesifikasi berubah (tuliskan contoh perubahannya), file dan fungsi mana yang harus diubah? Jelaskan alasannya.
- Contoh perubahan: Faktor emisi atau rumus perhitungan emisi karbon diperbarui oleh pemerintah.
- File dan fungsi yang diubah: `src/lib/emission.ts` pada fungsi `calculateShipmentEmission` atau objek pustaka faktor emisi. 
- Alasannya: Semua logika kalkulasi matematika terpusat di modul ini, sehingga perubahan rumus tidak akan merusak komponen UI lainnya.

2. Bagaimana data mengalir dari saat pengguna mengisi form sampai hasilnya tampil di layar? Sebutkan file dan fungsi yang dilewati secara berurutan.
- Pengguna mengisi data di `src/components/forms/shipment-entry-form.tsx` (`ShipmentEntryForm`).
- Form memanggil fungsi validasi dan perhitungan dari `src/lib/shipment-form.ts` / `src/lib/emission.ts` (`calculateShipmentEmission`).
- Data tersimpan ke *state/mock-data* di `src/lib/mock-data.ts`.
- Data diperbarui dan ditampilkan kembali di tabel `src/components/dashboard/shipments-table.tsx` (`ShipmentsTable`) dan grafik `src/components/charts/emission-trend-chart.tsx` (`EmissionTrendChart`).

3. Pilih satu unit test. Apa yang diuji, dan dalam kondisi apa test itu akan gagal?components\shipment-entry-form-test.tsx
Unit test yang dipilih: Validasi formulir pengiriman yang kosong.
- **Unit test yang dipilih:** `components\shipment-entry-form.test.tsx` - Validasi formulir pengiriman yang kosong.
- **Apa yang diuji:** Sistem harus menampilkan pesan kesalahan pada kolom input jika tombol catat ditekan saat formulir masih kosong.
- **Dalam kondisi apa test gagal:** Jika pesan kesalahan tidak muncul sesuai harapan atau sistem tetap berhasil mencatat pengiriman meskipun data belum diisi.
- **Apa yang diuji:** Sistem harus menampilkan pesan kesalahan pada empat kolom jika tombol catat ditekan saat formulir masih kosong.
- **Dalam kondisi apa test gagal:** Jika pesan kesalahan tidak muncul sesuai harapan atau sistem tetap mencatat pengiriman meskipun data belum diisi

4. Pilih satu saran AI yang kalian tolak. Apa sarannya dan kenapa kalian menolaknya? AI menyarankan bahwa kode riwayat pengiriman sudah memeriksa semua data yang kosong. Saya tidak langsung menerima saran AI itu, karena setelah saya memeriksa kode, saya menemukan bahwa sistem hanya memeriksa apakah moda transportasi bernilai null. Jadi, belum tentu semua data kosong terdeteksi.
- AI menyarankan bahwa kode riwayat pengiriman sudah memeriksa semua data yang kosong. Saran tersebut ditolak karena setelah diteliti pada kode `app\(dashboard)\shipments\page.tsx`, sistem hanya memeriksa apakah moda transportasi bernilai `null`. Data lain yang kosong belum terdeteksi.

5. Bagian kode mana yang paling sulit dipahami, dan bagaimana kalian akhirnya memahaminya?app\(dashboard)\laporan-emisi\page.tsx yaitu bagian : bagian yang menampilkan total emisi CO2e bulan ini dan persentase perubahannya dibandingkan bulan lalu. Bagaimana saya memahaminya mulai dari fungsi setiap baris kode. formatCO2e() menampilkan total emisi, sedangkan kondisi dan Math.abs() menentukan status serta persentase perubahan emisi.
- **Bagian kode:** `app\(dashboard)\laporan-emisi\page.tsx` pada bagian perhitungan statistik ringkasan emisi bulanan dan persentase perubahannya.
- **Cara memahaminya:** Menelusuri fungsi baris demi baris, di mana `formatCO2e()` memformat tampilan total emisi, sedangkan pembandingan kondisi dan `Math.abs()` menentukan indikator status serta besarnya persentase kenaikan/penurunan emisi.