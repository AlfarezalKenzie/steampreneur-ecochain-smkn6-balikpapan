# Catatan Arsitektur: Carbon Engine

## Aturan dependensi

```
interfaces/http ─┐
infrastructure ──┼──► application ──► domain
composition.ts ──┘
```

`domain` tidak mengimpor apa pun dari luar dirinya. `application` hanya bergantung pada `domain` dan pada interface (`ports`). Adapter di `infrastructure` mengimplementasikan port; `composition.ts` merakitnya. Akibatnya use case diuji tanpa database dan tanpa HTTP, dan Postgres bisa diganti tanpa menyentuh logika bisnis.

## Keputusan penting

| Keputusan | Alasan |
|---|---|
| Faktor emisi dipilih menurut tanggal pengiriman | Regulator merilis angka baru tiap tahun. Memakai "faktor terbaru" akan mengubah laporan historis tanpa disadari. |
| `PUT /shipments/{id}/emission` (bukan POST) | Satu hasil per pengiriman; mengulang request aman dan menimpa hasil lama. |
| Peringatan berat, bukan penolakan | Berat di atas kapasitas moda bisa salah ketik, bisa juga memang benar. Admin yang memutuskan. |
| Rekap memakai rentang `[from, to)` dengan offset zona waktu eksplisit | Batas bulan berbeda antara WIB, WITA, dan WIT; tidak ada asumsi zona waktu tersembunyi. |
| Rentang rekap dibatasi 366 hari | Melindungi database dari query tak terbatas. |
| Batas berat maks 100 ribu ton | Menjaga hasil tetap muat di kolom `NUMERIC(14,4)`. Periksa ulang presisi kolom bila batas dinaikkan. |
| Kolom DATE dibaca sebagai teks | Driver `pg` mengubah DATE menjadi waktu lokal server; ini membuat tanggal bisa bergeser sehari. Diuji pada tiga zona waktu. |

## Event

`emission.calculated` diterbitkan setelah hasil disimpan. Jika penerbitan gagal, request mengembalikan error tetapi hasil sudah tersimpan; klien yang mengulang request akan menerbitkan ulang (aman karena penyimpanan idempoten). Konsumen harus idempoten. Perbaikan jangka panjang: pola transactional outbox.
