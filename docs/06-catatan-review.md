# Catatan Code Review

Minta AI me-review kode kalian, lalu putuskan saran mana yang diterima.
Menolak saran AI dengan alasan yang jelas adalah hal yang baik.

**Prompt review yang dipakai:Bantu aku mereview kode yang sudah saya buat di link github tersebut berdasarkan isi kolom tabelnya**

| No | Saran dari AI | Diterima / ditolak | Alasan | Bagian kode yang berubah |
|---|---|---|---|---|
| 1 |Pindahkan URL API yang di-hardcode ke variabel lingkungan (.env) atau file konfigurasi terpusat (config.js) |Diterima |Mencegah penulisan ulang URL API di banyak file dan mempermudah pergantian dari server lokal ke server production |src/config/api.js |
|2 |Tambahkan penanganan eror (try-catch dan pesan indikator ke pengguna) saat pengambilan data grafik/tabel gagal |Diterima |Mencegah dashboard blank atau stuck tanpa kejelasan saat koneksi internet terputus atau API down |src/services/dashboardService.js / fungsi fetchData() |
|3 |Tambahkan atribut alt pada seluruh tag gambar (<img>) dan atribut aria-label pada tombol sidebar/toggle |Diterima | Meningkatkan standar aksesibilitas (accessibility) dan keterbacaan struktur HTML|src/components/Sidebar.html / Navbar.html |
|4 |Migrasikan seluruh pengelolaan data dashboard ke state management Redux Toolkit |Ditolak |Skala aplikasi web dashboard saat ini masih tergolong sederhana. Penambahan Redux hanya membuat struktur kode menjadi terlalu kompleks |Tidak ada perubahan kode. |
|5 |Ubah penyimpanan token autentikasi login dari localStorage ke HttpOnly Cookie |Ditolak |Perubahan memerlukan penyesuaian konfigurasi CORS dan domain pada server backend yang berada di luar ranah proyek web-dashboard tim kami saat ini |Tidak ada perubahan kode. |

Penjelasan kode ditulis terpisah di `08-penjelasan-kode.md`.
