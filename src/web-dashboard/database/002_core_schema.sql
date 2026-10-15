-- =============================================================================
-- Migration: 002_core_schema.sql
-- Tujuan   : Skema inti Service A (Supply Chain) & data referensi Service B
--            (Carbon Engine). Menggunakan PostGIS geography(Point) untuk data
--            lokasi agar perhitungan jarak akurat (bumi sferis, satuan meter),
--            bukan geometry planar yang salah untuk jarak lintas koordinat GPS.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: fungsi generik untuk auto-update kolom updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 1. RBAC: roles & permissions
-- =============================================================================

CREATE TABLE roles (
  id              SMALLSERIAL PRIMARY KEY,
  name            VARCHAR(50) NOT NULL UNIQUE,   -- 'admin', 'ops_manager', 'courier', 'auditor'
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE permissions (
  id              SMALLSERIAL PRIMARY KEY,
  code            VARCHAR(100) NOT NULL UNIQUE,  -- 'shipment:create', 'emission:read', dst.
  description     TEXT
);

CREATE TABLE role_permissions (
  role_id         SMALLINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id   SMALLINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- =============================================================================
-- 2. Users (autentikasi JWT, password di-hash di application layer - bcrypt/argon2)
-- =============================================================================

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           CITEXT NOT NULL UNIQUE,        -- case-insensitive; butuh ekstensi citext (lihat 001)
  password_hash   TEXT NOT NULL,                 -- HANYA hash (argon2id direkomendasikan). Tidak pernah simpan plaintext.
  full_name       VARCHAR(150) NOT NULL,
  role_id         SMALLINT NOT NULL REFERENCES roles(id),
  phone_number    VARCHAR(20),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Refresh token store (untuk rotasi & revoke JWT refresh token — mitigasi replay attack)
CREATE TABLE refresh_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL,                 -- simpan hash token, bukan token mentah
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id) WHERE revoked_at IS NULL;

-- =============================================================================
-- 3. Lokasi (Gudang, Titik Pengiriman) — PostGIS geography
-- =============================================================================

CREATE TABLE locations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(150) NOT NULL,
  type            VARCHAR(30) NOT NULL CHECK (type IN ('warehouse', 'customer', 'port', 'distribution_center')),
  address         TEXT,
  -- geography(Point, 4326): SRID 4326 = WGS84, standar koordinat GPS (lat/lon)
  geo_point       GEOGRAPHY(POINT, 4326) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index spasial GiST — wajib untuk query jarak/radius performan
CREATE INDEX idx_locations_geo_point ON locations USING GIST (geo_point);
CREATE INDEX idx_locations_type ON locations(type);

CREATE TRIGGER trg_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 4. Moda Transportasi & Faktor Emisi (data referensi utk Carbon Engine)
-- =============================================================================

CREATE TABLE transport_modes (
  id              SMALLSERIAL PRIMARY KEY,
  code            VARCHAR(30) NOT NULL UNIQUE,   -- 'truck_diesel', 'van_electric', 'ship_cargo', 'air_freight', 'rail'
  display_name    VARCHAR(100) NOT NULL,
  max_payload_kg  NUMERIC(12,2),
  is_active       BOOLEAN NOT NULL DEFAULT true
);

-- Faktor emisi mengikuti standar GHG Protocol / DEFRA — dipisah per moda & per satuan
-- agar bisa di-versi-kan (faktor emisi berubah tiap tahun rilis regulator).
CREATE TABLE emission_factors (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transport_mode_id   SMALLINT NOT NULL REFERENCES transport_modes(id),
  -- kg CO2e per (ton * km) — satuan paling umum dipakai standar logistik
  factor_kg_co2e_per_ton_km  NUMERIC(10,6) NOT NULL CHECK (factor_kg_co2e_per_ton_km >= 0),
  source              VARCHAR(100) NOT NULL,      -- 'GHG Protocol 2024', 'DEFRA 2024', dll.
  valid_from          DATE NOT NULL,
  valid_to            DATE,                        -- NULL = masih berlaku
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_emission_validity CHECK (valid_to IS NULL OR valid_to > valid_from),
  -- Satu faktor per moda per tanggal mulai berlaku. Juga membuat seed idempoten.
  CONSTRAINT uq_emission_factor_mode_valid_from UNIQUE (transport_mode_id, valid_from)
);

CREATE INDEX idx_emission_factors_mode_active
  ON emission_factors(transport_mode_id, valid_from DESC)
  WHERE valid_to IS NULL;

-- =============================================================================
-- 5. Kendaraan
-- =============================================================================

CREATE TABLE vehicles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number      VARCHAR(20) NOT NULL UNIQUE,
  transport_mode_id SMALLINT NOT NULL REFERENCES transport_modes(id),
  capacity_kg       NUMERIC(12,2) NOT NULL CHECK (capacity_kg > 0),
  driver_id         UUID REFERENCES users(id),     -- kurir yang biasa menjalankan kendaraan ini
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehicles_driver ON vehicles(driver_id);

-- =============================================================================
-- 6. Pesanan (Orders) & Pengiriman (Shipments)
-- =============================================================================

CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number    VARCHAR(40) NOT NULL UNIQUE,
  customer_name   VARCHAR(150) NOT NULL,
  status          VARCHAR(30) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE shipments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  origin_location_id      UUID NOT NULL REFERENCES locations(id),
  destination_location_id UUID NOT NULL REFERENCES locations(id),
  vehicle_id          UUID REFERENCES vehicles(id),
  transport_mode_id   SMALLINT NOT NULL REFERENCES transport_modes(id),

  weight_kg           NUMERIC(12,3) NOT NULL CHECK (weight_kg > 0),
  -- Jarak rute aktual (bukan garis lurus) diisi oleh routing engine; nullable saat draft
  planned_distance_km NUMERIC(10,3) CHECK (planned_distance_km >= 0),
  actual_distance_km  NUMERIC(10,3) CHECK (actual_distance_km >= 0),

  status              VARCHAR(30) NOT NULL DEFAULT 'scheduled'
                        CHECK (status IN ('scheduled','in_transit','delivered','delayed','cancelled')),

  scheduled_departure TIMESTAMPTZ,
  actual_departure    TIMESTAMPTZ,
  actual_arrival      TIMESTAMPTZ,

  -- Rute tersimpan sebagai LineString untuk visualisasi peta di dashboard
  route_geom          GEOGRAPHY(LINESTRING, 4326),

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_shipment_locations_diff CHECK (origin_location_id <> destination_location_id)
);

CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_vehicle_id ON shipments(vehicle_id) WHERE vehicle_id IS NOT NULL;
CREATE INDEX idx_shipments_route_geom ON shipments USING GIST (route_geom);
-- Index komposit untuk query dashboard umum: "pengiriman aktif per moda dalam rentang waktu"
CREATE INDEX idx_shipments_mode_status_departure ON shipments(transport_mode_id, status, scheduled_departure);

CREATE TRIGGER trg_shipments_updated_at
  BEFORE UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 7. Hasil Perhitungan Emisi per Pengiriman (ringkasan, agregat)
--    Catatan: log time-series mentah (per-sensor / per-detik) ADA DI TimescaleDB
--    (lihat migrasi 001_sensor_emission_logs.sql). Tabel ini adalah hasil AGREGAT
--    final per shipment untuk pelaporan cepat tanpa scan hypertable besar.
-- =============================================================================

CREATE TABLE shipment_emissions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id             UUID NOT NULL UNIQUE REFERENCES shipments(id) ON DELETE CASCADE,
  emission_factor_id      UUID NOT NULL REFERENCES emission_factors(id),
  distance_km_used        NUMERIC(10,3) NOT NULL,
  weight_ton_used         NUMERIC(12,6) NOT NULL,
  total_co2e_kg           NUMERIC(14,4) NOT NULL CHECK (total_co2e_kg >= 0),
  calculation_method      VARCHAR(30) NOT NULL DEFAULT 'distance_based'
                             CHECK (calculation_method IN ('distance_based','fuel_based','iot_measured')),
  -- Tanggal pengiriman: menentukan versi faktor emisi yang dipakai & periode laporan.
  shipment_date           TIMESTAMPTZ NOT NULL,
  calculated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shipment_emissions_calculated_at ON shipment_emissions(calculated_at DESC);
-- Rekap bulanan/rentang (Laporan Emisi) memfilter berdasarkan tanggal pengiriman
CREATE INDEX idx_shipment_emissions_shipment_date ON shipment_emissions(shipment_date);

-- =============================================================================
-- Komentar dokumentasi (muncul di banyak DB GUI tool / dbdocs)
-- =============================================================================
COMMENT ON TABLE shipment_emissions IS
  'Ringkasan hasil kalkulasi Carbon Engine per shipment. Sumber kebenaran (source of truth) '
  'untuk pelaporan dashboard; log mentah IoT ada di TimescaleDB hypertable sensor_emission_logs.';
COMMENT ON COLUMN emission_factors.factor_kg_co2e_per_ton_km IS
  'Faktor emisi standar (kg CO2e per ton-km). Di-versi-kan via valid_from/valid_to karena '
  'regulator merilis angka baru tiap tahun.';
