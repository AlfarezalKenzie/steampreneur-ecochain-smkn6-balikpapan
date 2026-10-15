# Instalasi dan Menjalankan Database (PostgreSQL)

Yang memakai database hanya **Carbon Engine**, dan itu opsional: tanpa `DATABASE_URL` service memakai penyimpanan di memori. Dashboard saat ini **belum** membaca database (semua angkanya data contoh).

Yang diuji: Ubuntu 24.04, PostgreSQL 16, PostGIS 3.4. Perintah Docker, Windows, dan macOS di bawah adalah panduan standar yang tidak sempat saya jalankan.

Kebutuhan: PostgreSQL 14 atau lebih baru dengan PostGIS. TimescaleDB tidak wajib.

Folder `database/` (file `001` sampai `004`) diletakkan di root repositori, sejajar dengan `services/` dan `apps/`.

## Langkah 1. Pasang dan jalankan PostgreSQL + PostGIS (pilih satu)

### A. Docker (paling mudah, semua sistem operasi)

```bash
docker run -d --name ecochain-db -e POSTGRES_PASSWORD=ecochain123 -e POSTGRES_DB=ecochain \
  -p 5432:5432 -v ecochain-data:/var/lib/postgresql/data postgis/postgis:16-3.4
docker ps
```

Tunggu status `Up`. Jika tag gambar tidak ditemukan, cari tag PostgreSQL 16 yang tersedia di Docker Hub (`postgis/postgis`). Jika port 5432 sudah dipakai, ganti `-p 5433:5432` dan ubah port di `DATABASE_URL`.

### B. Ubuntu atau WSL

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib postgis postgresql-16-postgis-3
sudo service postgresql start
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'ecochain123';"
sudo -u postgres createdb ecochain
```

Nama paket PostGIS mengikuti versi PostgreSQL di sistem Anda (`postgresql-<versi>-postgis-3`).

### C. Windows (tanpa Docker)

1. Unduh dan pasang PostgreSQL 16 dari postgresql.org (installer EDB). Catat password untuk user `postgres`.
2. Di akhir instalasi jalankan Stack Builder, pilih PostgreSQL 16, lalu **Spatial Extensions > PostGIS**.
3. Tambahkan `C:\Program Files\PostgreSQL\16\bin` ke PATH agar perintah `psql` bisa dipakai, lalu buka terminal baru.
4. Buat database: `psql -U postgres -h localhost -c "CREATE DATABASE ecochain;"`

### D. macOS

```bash
brew install postgresql@16 postgis
brew services start postgresql@16
createdb ecochain
```

## Langkah 2. Jalankan migrasi (urutannya penting)

Jalankan dari folder yang berisi `database/`. Hentikan jika ada error (`ON_ERROR_STOP`).

**Docker:**

```bash
docker cp database ecochain-db:/tmp/database
docker exec ecochain-db psql -U postgres -d ecochain -v ON_ERROR_STOP=1 -f /tmp/database/001_extensions.sql
docker exec ecochain-db psql -U postgres -d ecochain -v ON_ERROR_STOP=1 -f /tmp/database/002_core_schema.sql
docker exec ecochain-db psql -U postgres -d ecochain -v ON_ERROR_STOP=1 -f /tmp/database/003_rbac_seed.sql
```

**Tanpa Docker** (Linux/macOS; di Windows ganti `/` dengan `\`):

```bash
psql -U postgres -h localhost -d ecochain -v ON_ERROR_STOP=1 -f database/001_extensions.sql
psql -U postgres -h localhost -d ecochain -v ON_ERROR_STOP=1 -f database/002_core_schema.sql
psql -U postgres -h localhost -d ecochain -v ON_ERROR_STOP=1 -f database/003_rbac_seed.sql
```

Pesan `NOTICE: TimescaleDB tidak terpasang: dilewati` di langkah 001 **bukan error**. 001, 003, dan 004 aman dijalankan berulang. 002 tidak (lihat Masalah Umum).

## Langkah 3. Verifikasi

```sql
SELECT (SELECT count(*) FROM roles) AS roles,
       (SELECT count(*) FROM permissions) AS permissions,
       (SELECT count(*) FROM transport_modes) AS modes,
       (SELECT count(*) FROM emission_factors) AS factors,
       (SELECT count(*) FROM role_permissions) AS role_permissions;
```

Hasil yang diharapkan: `4 | 10 | 5 | 5 | 25`. Di Docker, jalankan lewat `docker exec ecochain-db psql -U postgres -d ecochain -c "..."`.

## Langkah 4 (opsional). Data pengiriman contoh

Carbon Engine menyimpan hasil per pengiriman, dan pengiriman itu harus sudah ada di tabel `shipments` (nanti dibuat Service A). Untuk mencoba tanpa Service A, jalankan `004_demo_data.sql` dengan cara yang sama seperti langkah 2. Ini membuat satu pengiriman dengan id `00000000-0000-4000-8000-0000000000d1`. Cara menghapusnya ada di komentar bawah file itu.

## Langkah 5. Hubungkan Carbon Engine

Di folder `services/carbon-engine`:

```bash
cp .env.example .env        # Windows: copy .env.example .env
```

Ubah baris ini di `.env`:

```
DATABASE_URL=postgres://postgres:ecochain123@localhost:5432/ecochain
```

Jika password berisi karakter khusus, encode dulu (misalnya `@` menjadi `%40`). Lalu:

```bash
npm install
npm run dev
```

Log harus memuat `persistence: PostgreSQL`. Cek koneksi: `curl localhost:4002/ready` harus menjawab `{"status":"ready"}`. Jika menjawab 503, database tidak terjangkau.

## Langkah 6. Uji

```bash
TOKEN=$(npm run --silent dev-token -- ops_manager)
curl -X POST localhost:4002/v1/emissions/estimate -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"modeCode":"truck_diesel","weightKg":1850,"distanceKm":122}'
```

Harus mengembalikan `totalCo2eKg` bernilai `24.1499`. Jika Anda menjalankan langkah 4:

```bash
curl -X PUT localhost:4002/v1/shipments/00000000-0000-4000-8000-0000000000d1/emission \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"modeCode":"truck_diesel","weightKg":1850,"distanceKm":122}'
curl localhost:4002/v1/shipments/00000000-0000-4000-8000-0000000000d1/emission -H "Authorization: Bearer $TOKEN"
```

Id pengiriman yang tidak ada mengembalikan HTTP 404 dengan kode `SHIPMENT_NOT_FOUND`.

Di PowerShell, `curl` adalah alias lain. Pakai Git Bash atau WSL, atau `Invoke-RestMethod`.

## Langkah 7. Jalankan test terhadap database

```bash
TEST_DATABASE_URL=postgres://postgres:ecochain123@localhost:5432/ecochain npm test
```

PowerShell: `$env:TEST_DATABASE_URL="postgres://postgres:ecochain123@localhost:5432/ecochain"; npm test`. Hasil yang diharapkan: 71 test lulus. Test membuat dan menghapus datanya sendiri.

## Menghentikan dan menyalakan lagi

Docker: `docker stop ecochain-db` dan `docker start ecochain-db` (data tetap ada di volume `ecochain-data`). Ubuntu/WSL: `sudo service postgresql stop` dan `start`.

## Masalah Umum

| Pesan atau gejala | Penyebab dan solusi |
|---|---|
| `could not open extension control file ... postgis.control` | PostGIS belum terpasang. Ulangi langkah 1. |
| `type "citext" does not exist` | Memakai `001_extensions.sql` versi lama. Pakai versi terbaru. |
| `relation "transport_modes" does not exist` | Langkah 002 belum dijalankan, atau terhubung ke database yang salah. |
| 002 gagal di tengah dan tidak bisa diulang | Buat ulang database (`DROP DATABASE ecochain; CREATE DATABASE ecochain;`) lalu jalankan dari 001. |
| `password authentication failed` | Password di `DATABASE_URL` tidak sama dengan password user `postgres`. |
| `connection refused` atau `/ready` 503 | PostgreSQL belum berjalan, atau port berbeda dari `DATABASE_URL`. |
| `port is already allocated` (Docker) | Port 5432 terpakai PostgreSQL lain. Pakai `-p 5433:5432` dan ubah port di `DATABASE_URL`. |
| PUT emission mengembalikan 404 `SHIPMENT_NOT_FOUND` | Pengiriman belum ada di tabel `shipments`. Untuk uji coba jalankan 004. |

## TimescaleDB (opsional, belum diuji)

`timescaledb_001_sensor_emission_logs.sql` hanya dibutuhkan untuk log sensor IoT, yang belum dipakai aplikasi. File itu belum pernah dijalankan karena TimescaleDB tidak tersedia di lingkungan pengembangan saya. Jangan jalankan sebelum TimescaleDB terpasang (image Docker `timescale/timescaledb-ha:pg16` memuatnya).
