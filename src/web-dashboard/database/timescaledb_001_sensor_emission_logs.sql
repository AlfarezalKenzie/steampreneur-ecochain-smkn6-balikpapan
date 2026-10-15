-- =============================================================================
-- Migration: timescaledb_001_sensor_emission_logs.sql
-- Tujuan   : Hypertable untuk data time-series volume tinggi:
--              (a) log sensor IoT kendaraan (GPS, kecepatan, konsumsi BBM)
--              (b) log emisi real-time yang dihitung Carbon Engine per interval
--            Dijalankan setelah extension timescaledb aktif (lihat 001_extensions.sql)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tabel log sensor IoT mentah
--    Karakteristik: insert-heavy, jarang di-update, di-query berdasar rentang waktu
--    -> kandidat ideal hypertable (auto-partisi berdasar waktu).
-- -----------------------------------------------------------------------------
CREATE TABLE sensor_tracking_logs (
  time              TIMESTAMPTZ       NOT NULL,
  shipment_id       UUID              NOT NULL,   -- FK logis ke shipments(id) di Postgres utama
                                                    -- (tidak dibuat FK fisik lintas DB bila TimescaleDB
                                                    --  dipisah sebagai instance sendiri; validasi di app layer)
  vehicle_id        UUID              NOT NULL,
  -- Lokasi disimpan sebagai lat/lon terpisah (bukan geography) karena TimescaleDB
  -- hypertable + PostGIS geography index bersamaan punya overhead lebih tinggi;
  -- untuk time-series volume tinggi, lat/lon numeric + index biasa lebih efisien.
  latitude          DOUBLE PRECISION  NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude         DOUBLE PRECISION  NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  speed_kmh         REAL              CHECK (speed_kmh >= 0),
  fuel_level_pct    REAL              CHECK (fuel_level_pct BETWEEN 0 AND 100),
  engine_status     VARCHAR(20),                  -- 'on','off','idle'
  odometer_km       NUMERIC(12,3),
  raw_payload       JSONB                          -- payload asli dari device, utk audit/debug
);

-- Ubah menjadi hypertable, partisi otomatis per 1 hari (chunk_time_interval)
SELECT create_hypertable(
  'sensor_tracking_logs',
  'time',
  chunk_time_interval => INTERVAL '1 day',
  if_not_exists => TRUE
);

-- Index komposit untuk query paling umum: "riwayat lokasi kendaraan/shipment tertentu"
CREATE INDEX idx_sensor_logs_shipment_time ON sensor_tracking_logs (shipment_id, time DESC);
CREATE INDEX idx_sensor_logs_vehicle_time  ON sensor_tracking_logs (vehicle_id, time DESC);

-- Compression: data lama (>7 hari) dikompresi otomatis untuk hemat storage & I/O
ALTER TABLE sensor_tracking_logs SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'vehicle_id, shipment_id',
  timescaledb.compress_orderby   = 'time DESC'
);

SELECT add_compression_policy('sensor_tracking_logs', INTERVAL '7 days');

-- Retention policy: hapus data mentah sensor setelah 180 hari (sesuaikan kebutuhan
-- regulasi/audit). Agregat penting sudah dipindah ke continuous aggregate di bawah.
SELECT add_retention_policy('sensor_tracking_logs', INTERVAL '180 days');

-- -----------------------------------------------------------------------------
-- 2. Tabel log emisi real-time (hasil kalkulasi inkremental Carbon Engine,
--    mis. tiap kendaraan mengirim telemetri tiap 30 detik -> dihitung emisi
--    per-segmen perjalanan, bukan hanya sekali di akhir seperti shipment_emissions)
-- -----------------------------------------------------------------------------
CREATE TABLE emission_readings (
  time              TIMESTAMPTZ       NOT NULL,
  shipment_id       UUID              NOT NULL,
  vehicle_id        UUID              NOT NULL,
  transport_mode_id SMALLINT          NOT NULL,
  segment_distance_km  NUMERIC(10,4)  NOT NULL CHECK (segment_distance_km >= 0),
  segment_co2e_kg      NUMERIC(12,6)  NOT NULL CHECK (segment_co2e_kg >= 0),
  cumulative_co2e_kg   NUMERIC(14,6)  NOT NULL CHECK (cumulative_co2e_kg >= 0)
);

SELECT create_hypertable(
  'emission_readings',
  'time',
  chunk_time_interval => INTERVAL '1 day',
  if_not_exists => TRUE
);

CREATE INDEX idx_emission_readings_shipment_time ON emission_readings (shipment_id, time DESC);

ALTER TABLE emission_readings SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'shipment_id, vehicle_id',
  timescaledb.compress_orderby   = 'time DESC'
);
SELECT add_compression_policy('emission_readings', INTERVAL '7 days');

-- -----------------------------------------------------------------------------
-- 3. Continuous Aggregate: rollup emisi per jam per moda transportasi.
--    Dipakai langsung oleh chart dashboard ("Tren Emisi 30 Hari Terakhir")
--    tanpa perlu scan tabel mentah -> query dashboard tetap cepat walau
--    data mentah sudah miliaran baris.
-- -----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW emission_hourly_by_mode
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time) AS bucket,
  transport_mode_id,
  sum(segment_co2e_kg)        AS total_co2e_kg,
  sum(segment_distance_km)    AS total_distance_km,
  count(*)                    AS reading_count
FROM emission_readings
GROUP BY bucket, transport_mode_id
WITH NO DATA;

-- Kebijakan refresh otomatis: agregat di-update tiap 30 menit, mencakup
-- window data dari 3 hari lalu hingga 1 jam lalu (menghindari race dengan data yang baru masuk)
SELECT add_continuous_aggregate_policy('emission_hourly_by_mode',
  start_offset      => INTERVAL '3 days',
  end_offset        => INTERVAL '1 hour',
  schedule_interval => INTERVAL '30 minutes'
);

-- -----------------------------------------------------------------------------
-- Dokumentasi
-- -----------------------------------------------------------------------------
COMMENT ON TABLE sensor_tracking_logs IS
  'Hypertable log mentah telemetri IoT kendaraan (GPS, kecepatan, BBM). '
  'Volume tinggi, insert-only, di-compress setelah 7 hari, retensi 180 hari.';
COMMENT ON TABLE emission_readings IS
  'Hypertable hasil kalkulasi emisi inkremental per segmen perjalanan (real-time). '
  'Dipakai sumber untuk continuous aggregate emission_hourly_by_mode.';
COMMENT ON MATERIALIZED VIEW emission_hourly_by_mode IS
  'Rollup per jam per moda transportasi, auto-refresh tiap 30 menit. '
  'Sumber utama chart analitik dashboard agar query tetap sub-detik.';
