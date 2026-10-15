-- =============================================================================
-- Migration: 001_extensions.sql
-- Tujuan   : Mengaktifkan ekstensi PostgreSQL yang dibutuhkan platform.
-- Catatan  : Jalankan sebagai superuser / role dengan hak CREATEEXTENSION.
--            TimescaleDB diaktifkan di DB terpisah (lihat database/timescaledb/)
--            atau di DB yang sama jika mengikuti pola "single Postgres instance,
--            multi-extension" (umum untuk skala prototipe -> menengah).
-- =============================================================================

-- UUID generator (gen_random_uuid) — direkomendasikan Postgres 13+
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- citext: kolom teks case-insensitive (dipakai users.email)
CREATE EXTENSION IF NOT EXISTS citext;

-- PostGIS: tipe data geometry/geography, fungsi jarak, index spasial (GiST)
CREATE EXTENSION IF NOT EXISTS postgis;

-- postgis_topology opsional (dibutuhkan bila ada analisis jaringan jalan lanjutan)
-- CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- pg_trgm: full-text/fuzzy search cepat untuk pencarian nama pelanggan/gudang
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- TimescaleDB (jika dijalankan dalam instance Postgres yang sama)
-- Wajib menjadi extension PERTAMA yang dimuat oleh shared_preload_libraries.
-- Dibungkus agar migrasi tetap berjalan bila TimescaleDB belum terpasang. Ekstensi ini HANYA
-- dibutuhkan oleh timescaledb_001_sensor_emission_logs.sql; Service B (Carbon Engine) tidak memakainya.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS timescaledb;
EXCEPTION WHEN feature_not_supported OR undefined_file THEN
  RAISE NOTICE 'TimescaleDB tidak terpasang: dilewati. Pasang dulu sebelum menjalankan timescaledb_001_sensor_emission_logs.sql';
END
$$;

-- Verifikasi cepat
-- SELECT extname, extversion FROM pg_extension;
