# Log Prompt

**Alat AI yang dipakai:** Claude (Anthropic), lewat antarmuka chat claude.ai.

Catat prompt penting saja, tidak perlu semuanya. Yang wajib dicatat: prompt yang menghasilkan kode utama, prompt yang hasilnya ditolak atau diperbaiki, dan prompt untuk debugging.

| No | Waktu | Langkah ke- | Prompt (ringkas) | Hasil dari AI | Keputusan tim (diterima / diubah / ditolak) dan alasannya |
|---|---|---|---|---|---|
| 1 | | Di luar langkah 1-5 (arsitektur awal) | Bertindak sebagai Principal Software Architect. Bangun prototipe Smart Supply Chain & Carbon Footprint Tracking. Mulai dari struktur direktori dan skema basis data (PostgreSQL/PostGIS, TimescaleDB). | Dokumen arsitektur (modular monolith, struktur monorepo) dan 4 file migrasi SQL. Saat diserahkan, SQL belum pernah dijalankan. | Diubah. Saat dijalankan di PostgreSQL asli, ditemukan 3 masalah buatan AI: ekstensi citext tidak diaktifkan sehingga migrasi gagal, seed faktor emisi menggandakan baris jika dijalankan dua kali, dan kolom shipment_date belum ada. Ketiganya diperbaiki. Migrasi TimescaleDB belum pernah dijalankan. |
| 2 | | 1 | Mulai membuat project dari dashboard. Pakai Shell Dashboard Next.js atau bisa Laravel? | AI membandingkan keduanya dan meminta tim memilih lewat tombol. Setelah Next.js dipilih, AI membangun shell dashboard (sidebar, topbar, strip metrik, grafik, tabel, data contoh). Di tengah jalan AI menemukan Next.js 14.2.15 sudah tidak didukung dan Recharts 2 tidak cocok dengan React 19, lalu menaikkan ke Next.js 16.4 dan Recharts 3.6. AI tidak bisa membuka hasilnya di browser; yang diperiksa hanya type-check dan build. | Diterima: tim memilih Next.js. Alasan sesuai pilihan yang diambil: konsisten dengan rencana awal dan backend Node.js. Tampilan shell ini kemudian diubah. |
| 3 | | Di luar langkah 1-5 (backend) | Lanjut ke Boilerplate Backend Carbon Engine (Service B) sekarang. | Layanan Node.js dan TypeScript dengan Clean Architecture, endpoint estimasi dan rekap emisi, JWT dan RBAC, 69 test (4 di antaranya terhadap PostgreSQL asli). Saat SQL dijalankan, AI menemukan dan memperbaiki 3 bug dari No. 1. Belum ada adapter RabbitMQ dan belum terhubung ke dashboard. | [isi: diterima]. Catatan: spesifikasi bagian 5 menyebut backend tidak dihubungkan ke website. |


## Catatan
- Yang tidak bisa dilakukan AI dan masih harus dicek tim: membuka dashboard di browser (AI hanya menjalankan build dan test di jsdom), menjalankan migrasi TimescaleDB, mencoba CSV di Excel, memverifikasi jarak rute dan faktor emisi dengan sumber resmi, dan menghitung hasil yang diharapkan di 04-kasus-uji.md.
- Prompt untuk mengisi file log ini sendiri tidak dicatat.
