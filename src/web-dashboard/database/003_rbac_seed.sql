-- =============================================================================
-- Migration: 003_rbac_seed.sql
-- Tujuan   : Data awal RBAC. Idempotent (aman dijalankan ulang) via ON CONFLICT.
-- =============================================================================

INSERT INTO roles (name, description) VALUES
  ('admin',       'Akses penuh ke seluruh sistem, termasuk manajemen pengguna'),
  ('ops_manager', 'Mengelola pesanan, pengiriman, dan rute'),
  ('courier',     'Akses terbatas: update status pengiriman & kirim data lokasi via mobile app'),
  ('auditor',     'Akses baca-saja ke laporan emisi & kepatuhan')
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (code, description) VALUES
  ('shipment:create',   'Membuat pengiriman baru'),
  ('shipment:read',     'Melihat data pengiriman'),
  ('shipment:update',   'Mengubah status/detail pengiriman'),
  ('shipment:delete',   'Menghapus/membatalkan pengiriman'),
  ('order:create',      'Membuat pesanan baru'),
  ('order:read',        'Melihat pesanan'),
  ('emission:read',     'Melihat laporan/analitik emisi karbon'),
  ('emission:recalculate', 'Memicu ulang perhitungan emisi'),
  ('user:manage',       'Mengelola akun pengguna & role'),
  ('tracking:submit',   'Mengirim data lokasi/sensor GPS dari mobile app')
ON CONFLICT (code) DO NOTHING;

-- Admin: seluruh permission
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Ops Manager: semua kecuali user:manage
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'ops_manager' AND p.code <> 'user:manage'
ON CONFLICT DO NOTHING;

-- Courier: hanya baca pengiriman miliknya + kirim data tracking
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'courier' AND p.code IN ('shipment:read','shipment:update','tracking:submit')
ON CONFLICT DO NOTHING;

-- Auditor: baca-saja untuk emisi & pengiriman
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'auditor' AND p.code IN ('shipment:read','order:read','emission:read')
ON CONFLICT DO NOTHING;

-- Seed moda transportasi dasar
INSERT INTO transport_modes (code, display_name, max_payload_kg) VALUES
  ('truck_diesel',  'Truk Diesel',            8000),
  ('van_electric',  'Van Listrik',            1200),
  ('ship_cargo',    'Kapal Kargo',        50000000),
  ('air_freight',   'Kargo Udara',           30000),
  ('rail',          'Kereta Barang',       2000000)
ON CONFLICT (code) DO NOTHING;

-- Seed faktor emisi contoh (angka ilustratif — GANTI dengan angka resmi
-- GHG Protocol / DEFRA / Kementerian LHK sebelum digunakan di produksi)
INSERT INTO emission_factors (transport_mode_id, factor_kg_co2e_per_ton_km, source, valid_from)
SELECT id, v.factor, 'DEFRA 2024 (ilustratif)', '2024-01-01'
FROM transport_modes tm
JOIN (VALUES
  ('truck_diesel', 0.107000),
  ('van_electric', 0.045000),
  ('ship_cargo',   0.008000),
  ('air_freight',  0.602000),
  ('rail',         0.028000)
) AS v(code, factor) ON tm.code = v.code
ON CONFLICT (transport_mode_id, valid_from) DO NOTHING;
