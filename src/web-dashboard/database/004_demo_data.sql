-- =============================================================================
-- 004_demo_data.sql  (OPSIONAL, hanya untuk mencoba Carbon Engine tanpa Service A)
-- Membuat 1 pengiriman contoh dengan id tetap, supaya endpoint
--   PUT /v1/shipments/00000000-0000-4000-8000-0000000000d1/emission
-- bisa dicoba. Aman dijalankan berulang. Hapus dengan perintah di bagian bawah file ini.
-- =============================================================================
INSERT INTO locations (id, name, type, geo_point) VALUES
  ('00000000-0000-4000-8000-0000000000a1', 'DEMO Gudang Balikpapan', 'warehouse', ST_GeogFromText('POINT(116.83 -1.24)')),
  ('00000000-0000-4000-8000-0000000000a2', 'DEMO Samarinda', 'customer', ST_GeogFromText('POINT(117.15 -0.50)'))
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, order_number, customer_name) VALUES
  ('00000000-0000-4000-8000-0000000000b1', 'DEMO-ORD-1', 'Pelanggan Demo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO shipments (id, order_id, origin_location_id, destination_location_id, transport_mode_id, weight_kg)
SELECT '00000000-0000-4000-8000-0000000000d1',
       '00000000-0000-4000-8000-0000000000b1',
       '00000000-0000-4000-8000-0000000000a1',
       '00000000-0000-4000-8000-0000000000a2',
       (SELECT id FROM transport_modes WHERE code = 'truck_diesel'),
       1850
ON CONFLICT (id) DO NOTHING;

-- Untuk menghapus data demo (jalankan manual bila sudah tidak diperlukan):
--   DELETE FROM orders WHERE id = '00000000-0000-4000-8000-0000000000b1';  -- ikut menghapus shipments & emisinya
--   DELETE FROM locations WHERE id IN ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a2');
