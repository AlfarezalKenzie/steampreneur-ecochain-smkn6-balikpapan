# Carbon Engine (Service B)

Layanan backend EcoChain yang menghitung emisi karbon (kg CO2e) per pengiriman dari berat, jarak, dan moda transportasi. Dipakai admin ekspedisi lewat dashboard untuk pratinjau emisi saat mencatat pesanan dan untuk rekap Laporan Emisi (Scope 3).

## Alur Inti

1. Admin mengisi form "Catat Pengiriman" (berat, tujuan, moda). Dashboard memanggil `POST /v1/emissions/estimate` dan menampilkan pratinjau emisi beserta peringatan jika berat tidak wajar untuk moda tersebut.
2. Saat pesanan disimpan, sistem memanggil `PUT /v1/shipments/{id}/emission`. Hasil disimpan dan event `emission.calculated` diterbitkan.
3. Untuk Laporan Emisi, dashboard memanggil `GET /v1/emissions/summary?from=...&to=...` dan mendapat total serta rincian per moda.

Rumus (metode berbasis jarak, GHG Protocol/DEFRA): `emisi = berat (ton) × jarak (km) × faktor (kg CO2e per ton-km)`. Faktor yang dipakai adalah yang berlaku pada **tanggal pengiriman**.

## Cara Menjalankan (How to Run)

### Prasyarat

- Node.js 20 atau lebih baru (diuji dengan 22)
- PostgreSQL 14+ dengan PostGIS (opsional; tanpa ini service memakai penyimpanan in-memory)

### Langkah (mode cepat, in-memory)

```bash
npm install
cp .env.example .env
npm run dev
```

Service berjalan di http://localhost:4002. Cek: `curl localhost:4002/health`.

Coba endpoint dengan token dev:

```bash
TOKEN=$(npm run --silent dev-token -- ops_manager)
curl -X POST localhost:4002/v1/emissions/estimate \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"modeCode":"truck_diesel","weightKg":1850,"distanceKm":122}'
```

Hasil yang diharapkan: `totalCo2eKg` bernilai `24.1499`.

### Mode PostgreSQL

1. Pasang PostgreSQL + PostGIS, buat database, dan jalankan migrasi `database/001` sampai `003` (opsional `004_demo_data.sql`). Langkah lengkap, termasuk Docker, Windows, dan masalah umum, ada di [docs/instalasi-database.md](docs/instalasi-database.md). TimescaleDB tidak wajib; 001 otomatis melewatinya jika belum terpasang.
2. Isi `DATABASE_URL` di `.env`, mis. `postgres://user:pass@localhost:5432/ecochain`.
3. `npm run dev`. Log akan menyebut `persistence: PostgreSQL`, dan `GET /ready` mengecek koneksi database.

### Build produksi

```bash
npm run build
npm start
```

### Akun atau data contoh

Tidak ada akun; autentikasi memakai JWT. Untuk pengembangan, terbitkan token uji per peran:

| Peran | Perintah | Akses |
|---|---|---|
| ops_manager | `npm run dev-token -- ops_manager` | estimasi, hitung ulang, baca, rekap |
| auditor | `npm run dev-token -- auditor` | estimasi, baca, rekap (tidak bisa hitung ulang) |
| courier | `npm run dev-token -- courier` | ditolak (403) pada endpoint emisi |
| admin | `npm run dev-token -- admin` | semua |

Angka faktor emisi di data contoh bersifat **ilustratif**.

### Jika terjadi masalah

| Gejala | Penyebab dan solusi |
|---|---|
| `Konfigurasi environment tidak valid: JWT_SECRET ...` | Isi `JWT_SECRET` minimal 32 karakter di `.env`. |
| `EADDRINUSE` | Port 4002 terpakai. Ubah `PORT` di `.env`. |
| `/ready` mengembalikan 503 | Database tidak terjangkau. Periksa `DATABASE_URL` dan pastikan PostgreSQL berjalan. |
| `PUT .../emission` mengembalikan 404 `SHIPMENT_NOT_FOUND` di mode PostgreSQL | Pengiriman harus sudah ada di tabel `shipments` (dibuat Service A). Untuk uji coba jalankan `database/004_demo_data.sql`. |
| Rekap mengembalikan 422 padahal parameter ada | Tanda `+` pada offset zona waktu harus di-encode `%2B` (mis. `2026-10-01T00:00:00%2B08:00`). |
| 401 padahal token baru dibuat | `JWT_SECRET`, `JWT_ISSUER`, atau `JWT_AUDIENCE` saat menerbitkan token berbeda dengan yang dipakai server. |

## Endpoint

| Method | Path | Izin | Fungsi |
|---|---|---|---|
| GET | `/health`, `/ready` | tanpa | Probe liveness dan readiness |
| POST | `/v1/emissions/estimate` | `emission:read` | Estimasi tanpa menyimpan |
| PUT | `/v1/shipments/{id}/emission` | `emission:recalculate` | Hitung dan simpan (idempoten) |
| GET | `/v1/shipments/{id}/emission` | `emission:read` | Baca hasil tersimpan |
| GET | `/v1/emissions/summary` | `emission:read` | Rekap total dan per moda dalam rentang waktu `[from, to)` |

Format error seragam: `{"error": {"code", "message", "details"?, "requestId"}}`.

## Cara Menjalankan Pengujian

```bash
npm test
```

Hasil yang diharapkan: 66 test lulus, 5 dilewati (test PostgreSQL). Untuk menjalankan test PostgreSQL pada database yang sudah dimigrasi:

```bash
TEST_DATABASE_URL=postgres://user:pass@localhost:5432/ecochain npm test
```

Hasil yang diharapkan: 71 test lulus. Test membuat dan menghapus datanya sendiri (rentang tahun 2099).

## Fitur

- Perhitungan emisi per pengiriman dengan faktor emisi berversi menurut tanggal pengiriman
- Peringatan otomatis bila berat melebihi kapasitas umum moda (menjawab temuan lapangan "salah catat berat")
- Hitung ulang idempoten per pengiriman, rekap per rentang waktu dan per moda
- JWT (HS256, issuer dan audience dikunci) dan RBAC per rute
- Validasi input ketat (field tak dikenal ditolak, batas ukuran body 10 KB), rate limiting, header keamanan (helmet)
- Error tak terduga menjadi 500 generik tanpa detail internal; secret tidak masuk log
- Konfigurasi divalidasi saat startup (fail-fast); graceful shutdown

## Batasan yang Diketahui

- Adapter RabbitMQ/Redis Streams belum ada; event saat ini hanya dicatat ke log (`LogEventPublisher`). Penyimpanan dan penerbitan event belum atomik (belum ada outbox), jadi event bersifat at-least-once dan konsumen harus idempoten.
- Token memakai HS256 dengan secret bersama. Untuk produksi sebaiknya RS256/EdDSA agar Service B hanya memegang public key.
- Rate limit disimpan di memori per instance; dengan banyak instance perlu penyimpanan bersama (mis. Redis).
- Angka faktor emisi pada seed bersifat ilustratif, belum angka resmi.
- Performa belum diukur (tidak ada load test).
- Dashboard belum memanggil service ini; rumus di form dashboard masih salinan lokal.
- Migrasi TimescaleDB (`timescaledb_001_...sql`) belum pernah dijalankan karena TimescaleDB tidak tersedia di lingkungan pengembangan saya.

## Struktur Folder

| File / folder | Isi |
|---|---|
| `src/domain/` | Entitas, value object, kalkulator emisi, error domain (tanpa framework dan I/O) |
| `src/application/` | Port (interface) dan use case |
| `src/infrastructure/` | Adapter PostgreSQL dan in-memory, konfigurasi, logger, publisher event |
| `src/interfaces/http/` | Express: rute, middleware auth/RBAC/error |
| `src/composition.ts`, `src/server.ts` | Perakitan dependensi dan entry point |
| `tests/` | Test unit dan integrasi |
| `scripts/` | Penerbit token dev |
| `docs/` | Catatan arsitektur |

## Sumber dan Lisensi

| Nama | Sumber (link) | Lisensi |
|---|---|---|
| express | https://www.npmjs.com/package/express | MIT |
| express-rate-limit | https://www.npmjs.com/package/express-rate-limit | MIT |
| helmet | https://www.npmjs.com/package/helmet | MIT |
| jsonwebtoken | https://www.npmjs.com/package/jsonwebtoken | MIT |
| pg | https://www.npmjs.com/package/pg | MIT |
| pino | https://www.npmjs.com/package/pino | MIT |
| zod | https://www.npmjs.com/package/zod | MIT |
| vitest, supertest, tsx | https://www.npmjs.com/ | MIT |
| typescript | https://www.npmjs.com/package/typescript | Apache-2.0 |
