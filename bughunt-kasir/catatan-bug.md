# Catatan Bug Hunt: Kasir Kantin STEAM

**Nama tim:** Tim EcoChain

Buat satu entri untuk setiap bug yang ditemukan. Simpan file ini di folder `bughunt-kasir/`.

Ringkasan: 6 bug pada aturan bisnis (di `kasir.js`) dan 1 bug kecil pada tampilan (di `app.js`).
Semua test dijalankan dengan `node --test` (32 test: 17 gagal pada kode asli, 32 lulus setelah perbaikan).

## Bug 1
- **Gejala** (apa yang terlihat salah): Jumlah kosong, 0, negatif, pecahan, atau lebih dari 99 diterima begitu saja dan masuk ke keranjang. Jumlah negatif membuat total menjadi negatif.
- **Langkah untuk memunculkan bug:** Pilih produk apa saja, isi kolom Jumlah dengan `0`, `-3`, `2.5`, `150`, atau kosongkan, lalu klik Tambah. Tidak ada pesan kesalahan.
- **Aturan bisnis yang dilanggar** (nomor aturan di README): 1
- **Penyebab** (file, fungsi, dan penjelasan): `kasir.js`, fungsi `tambahItem`. Nilai `qty` langsung dipakai tanpa diperiksa sama sekali.
- **Perbaikan** (apa yang diubah): Ditambahkan fungsi `validasiQty` yang hanya menerima bilangan bulat 1 sampai 99 (angka atau teks angka) dan melempar pesan "Jumlah harus bilangan bulat dari 1 sampai 99" untuk nilai lain. Validasi dilakukan sebelum keranjang diubah, jadi keranjang tidak berubah saat ditolak.
- **Test yang membuktikan** (nama test): `bug 1: jumlah kosong / nol / nol berupa teks / negatif / pecahan / pecahan berupa teks / bukan angka / lebih dari 99 / undefined ditolak dan keranjang tidak berubah`; `bug 1: batas jumlah 1 dan 99 diterima`
- **Commit perbaikan** (pesan commit): `fix(kasir): validasi jumlah pesanan harus bilangan bulat 1-99` usulan: Rafa Rizki
- **Ditemukan oleh:** Rafa Rizki

## Bug 2
- **Gejala:** Es Teh 2 lalu tambah Es Teh 3 tertulis **23**, bukan 5 (angka digabung seperti teks). Selain itu, jumlah satu produk bisa melewati 99 lewat penambahan berulang.
- **Langkah untuk memunculkan bug:** Di halaman, tambah Es Teh jumlah 2, lalu tambah Es Teh jumlah 3. Untuk batas 99: tambah Es Teh 60, lalu tambah Es Teh 40, maka jumlah menjadi 100.
- **Aturan bisnis yang dilanggar:** 2
- **Penyebab:** `app.js` mengirim `elQty.value`, yaitu **teks** (`"2"`), ke `tambahItem` di `kasir.js`. Di sana `itemLama.qty += qty` pada teks menjadi penyambungan teks (`"2" + "3" = "23"`). Selain itu, tidak ada pemeriksaan batas 99 pada jumlah gabungan.
- **Perbaikan:** `tambahItem` kini mengubah jumlah menjadi angka lewat `validasiQty` sebelum dijumlahkan, dan menolak (dengan pesan "Total jumlah per produk tidak boleh lebih dari 99") jika jumlah gabungan melebihi 99. Keranjang tidak berubah saat ditolak.
- **Test yang membuktikan:** `bug 2: jumlah berupa teks dari kolom isian tetap dijumlahkan sebagai angka`; `bug 2: total jumlah per produk lebih dari 99 ditolak dan keranjang tidak berubah`; `bug 2: total jumlah per produk tepat 99 diterima`; `bug 2: Es Teh 2 lalu tambah 3 menjadi 5 (jumlah berupa angka)`
- **Commit perbaikan:** `fix(kasir): jumlahkan qty sebagai angka dan batasi total per produk maksimal 99` usulan :Kenzi
- **Ditemukan oleh:** Alya

## Bug 3
- **Gejala:** Member dengan belanja besar mendapat diskon 15% (bukan 10%).
- **Langkah untuk memunculkan bug:** Centang "Pelanggan member", lalu belanja dengan subtotal di atas Rp100.000 (misalnya Nasi Goreng 7 buah = Rp105.000). Diskon tampil Rp15.750, seharusnya Rp10.500.
- **Aturan bisnis yang dilanggar:** 4 (diskon tidak boleh digabung, hanya satu yang berlaku)
- **Penyebab:** `kasir.js`, fungsi `hitungDiskon`. Diskon belanja 5% dan diskon member 10% sama-sama ditambahkan ke variabel `diskon` (`diskon += ...`), jadi bisa berlaku bersamaan.
- **Perbaikan:** Dibuat bercabang: jika member, hanya 10%; jika bukan member dan subtotal memenuhi syarat, hanya 5%; selain itu 0. Perhitungan persen juga dibuat dengan bilangan bulat (`persenBulat`) agar pembulatan "0,5 ke atas naik" tepat.
- **Test yang membuktikan:** `bug 3: member dengan subtotal besar hanya mendapat 10%, tidak digabung 5%`; `bug 3: ringkasan member Rp105.000 hanya diskon 10%`; (pengaman) `bug 3: member dengan subtotal kecil mendapat 10%`, `bug 3: bukan member dengan subtotal besar mendapat 5%`, `diskon dibulatkan ke rupiah terdekat (0,5 ke atas naik)`
- **Commit perbaikan:** `fix(kasir): diskon member dan diskon belanja tidak boleh digabung` usulan : Kenzi
- **Ditemukan oleh:** Alya

## Bug 4
- **Gejala:** Bukan member dengan subtotal tepat Rp100.000 tidak mendapat diskon 5%.
- **Langkah untuk memunculkan bug:** Tanpa centang member, buat subtotal tepat Rp100.000 (misalnya Es Teh 25 buah). Diskon Rp0, seharusnya Rp5.000.
- **Aturan bisnis yang dilanggar:** 4 ("minimal Rp100.000" berarti 100.000 ke atas)
- **Penyebab:** `kasir.js`, fungsi `hitungDiskon`. Syaratnya `subtotal > 100000` (lebih dari), padahal seharusnya `>=` (minimal).
- **Perbaikan:** Syarat diubah menjadi `subtotal >= 100000`.
- **Test yang membuktikan:** `bug 4: bukan member dengan subtotal tepat Rp100.000 mendapat diskon 5%`; (pengaman batas bawah) `bug 4: bukan member dengan subtotal Rp99.999 tidak mendapat diskon`
- **Commit perbaikan:** `fix(kasir): diskon 5% berlaku mulai subtotal tepat Rp100.000` usulan : Alya
- **Ditemukan oleh:** Alya

## Bug 5
- **Gejala:** PPN selalu terpotong ke bawah, sehingga total bisa kurang Rp1 dari yang benar.
- **Langkah untuk memunculkan bug:** Bukan member, Nasi Goreng 7 buah: subtotal Rp105.000, diskon Rp5.250, dasar pajak Rp99.750. PPN seharusnya 10.972,5 menjadi **Rp10.973**, tetapi tampil Rp10.972 (total Rp110.722, seharusnya Rp110.723).
- **Aturan bisnis yang dilanggar:** 5 (dibulatkan ke rupiah terdekat, 0,5 ke atas naik)
- **Penyebab:** `kasir.js`, fungsi `hitungPPN`. Memakai `Math.floor` (bulat ke bawah), bukan pembulatan ke terdekat.
- **Perbaikan:** PPN dihitung dengan `persenBulat(dasar, 11)`, yaitu `Math.floor((dasar * 11 + 50) / 100)` pada bilangan bulat. Hasilnya sama dengan pembulatan ke terdekat (0,5 naik) tetapi bebas dari kesalahan pecahan desimal.
- **Test yang membuktikan:** `bug 5: PPN dibulatkan ke rupiah terdekat`; `bug 5: ringkasan bukan member Rp105.000 (PPN 10.972,5 dibulatkan naik)`; (pengaman) `PPN yang sudah bulat tidak berubah`
- **Commit perbaikan:** `fix(kasir): bulatkan PPN ke rupiah terdekat, bukan ke bawah` usulan : Alya
- **Ditemukan oleh:** Alya

## Bug 6
- **Gejala:** Uang yang dibayar kurang dari total tetap dianggap "Pembayaran berhasil" dengan kembalian negatif. Uang dibayar kosong juga lolos.
- **Langkah untuk memunculkan bug:** Tambah produk apa saja, isi "Uang dibayar" dengan angka lebih kecil dari total (atau kosongkan), lalu klik Bayar. Muncul "Pembayaran berhasil" dan kembalian minus.
- **Aturan bisnis yang dilanggar:** 7
- **Penyebab:** `kasir.js`, fungsi `hitungKembalian`. Hanya menghitung `bayar - total` tanpa memeriksa apakah uang cukup. (`app.js` sudah menyiapkan `try/catch`, tetapi tidak pernah ada error yang dilempar.)
- **Perbaikan:** Jika `bayar < total`, dilempar error "Uang pembayaran kurang" (ditampilkan oleh `app.js` yang sudah ada). Ditambah pengaman: nilai yang bukan angka ditolak dengan "Uang pembayaran tidak valid".
- **Test yang membuktikan:** `bug 6: uang pembayaran kurang dari total ditolak`; (pengaman) `uang pas menghasilkan kembalian 0`, `uang lebih menghasilkan kembalian = bayar - total`
- **Commit perbaikan:** `fix(kasir): tolak pembayaran yang kurang dari total` Usulan : Kenzi
- **Ditemukan oleh:** Kenzi

## Bug 7 (tampilan, temuan tambahan)
- **Gejala:** Setelah klik Bayar, tulisan hijau "Pembayaran berhasil" tetap muncul walaupun keranjang atau status member diubah sesudahnya (kembalian sudah hilang, tetapi pesan sukses masih ada, jadi tidak konsisten).
- **Langkah untuk memunculkan bug:** Tambah produk, isi uang cukup, klik Bayar, lalu centang/hapus centang "Pelanggan member" atau hapus produk.
- **Aturan bisnis yang dilanggar:** Tidak ada nomor aturan khusus (perilaku tampilan, bukan aturan bisnis).
- **Penyebab:** `app.js`, fungsi `render`. Mengosongkan `elHasilBayar` (kembalian) tetapi tidak mengosongkan pesan status.
- **Perbaikan:** `render` kini juga memanggil `tampilkanPesan("", "")`. Pesan kesalahan tidak ikut terhapus karena error muncul sesudah/tanpa `render`.
- **Test yang membuktikan:** Tidak ada test otomatis (kode tampilan butuh browser). Diverifikasi dengan simulasi DOM: setelah bayar berhasil lalu toggle member, pesan menjadi kosong.
- **Commit perbaikan:** `fix(app): kosongkan pesan status saat tampilan keranjang diperbarui` _(Kenzi)_
- **Ditemukan oleh:** Rafa Rizki
