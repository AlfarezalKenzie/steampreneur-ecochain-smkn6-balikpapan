import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildUseCases } from "../../src/composition";
import { ShipmentNotFoundError } from "../../src/domain/errors";
import {
  PgEmissionFactorRepository,
  PgShipmentEmissionRepository,
  PgTransportModeRepository,
} from "../../src/infrastructure/persistence/postgres";
import { fixedClock, SpyPublisher } from "../helpers";

/**
 * Berjalan HANYA bila TEST_DATABASE_URL di-set (database yang sudah dimigrasi dengan
 * database/001..003). Test membuat data sendiri (rentang tahun 2099) dan menghapusnya
 * di akhir, sehingga aman dijalankan berulang.
 */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("adapter PostgreSQL (database nyata)", () => {
  const pool = new Pool({ connectionString: url, max: 2 });
  const modes = new PgTransportModeRepository(pool);
  const factors = new PgEmissionFactorRepository(pool);
  const emissions = new PgShipmentEmissionRepository(pool);

  const ids: { orderId: string; locs: string[]; shipments: string[] } = { orderId: "", locs: [], shipments: [] };

  beforeAll(async () => {
    // Pengiriman butuh rantai FK: lokasi -> pesanan -> pengiriman. Dibuat minimal untuk test.
    for (const [name, lng] of [["T-Asal", 116.83], ["T-Tujuan", 117.15]] as const) {
      const r = await pool.query<{ id: string }>(
        `INSERT INTO locations (name, type, geo_point) VALUES ($1, 'warehouse', ST_GeogFromText($2)) RETURNING id`,
        [name, `POINT(${lng} -1.24)`],
      );
      ids.locs.push(r.rows[0]!.id);
    }
    const order = await pool.query<{ id: string }>(
      `INSERT INTO orders (order_number, customer_name) VALUES ($1, 'Test') RETURNING id`,
      [`TEST-${Date.now()}`],
    );
    ids.orderId = order.rows[0]!.id;
    for (let i = 0; i < 3; i++) {
      const s = await pool.query<{ id: string }>(
        `INSERT INTO shipments (order_id, origin_location_id, destination_location_id, transport_mode_id, weight_kg)
         VALUES ($1, $2, $3, (SELECT id FROM transport_modes WHERE code = 'truck_diesel'), 100) RETURNING id`,
        [ids.orderId, ids.locs[0], ids.locs[1]],
      );
      ids.shipments.push(s.rows[0]!.id);
    }
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM orders WHERE id = $1`, [ids.orderId]); // cascade ke shipments & shipment_emissions
    await pool.query(`DELETE FROM locations WHERE id = ANY($1)`, [ids.locs]);
    await pool.end();
  });

  it("membaca moda transportasi", async () => {
    expect(await modes.findByCode("truck_diesel")).toMatchObject({ code: "truck_diesel", displayName: "Truk Diesel", maxPayloadKg: 8000 });
    expect(await modes.findByCode("hovercraft")).toBeNull();
  });

  it("menemukan faktor emisi aktif pada tanggal tertentu, bebas dari zona waktu server", async () => {
    const f = await factors.findActiveForMode("truck_diesel", new Date("2026-10-11T03:00:00Z"));
    expect(f).toMatchObject({ modeCode: "truck_diesel", kgCo2ePerTonKm: 0.107 });
    expect(f?.validFrom.toISOString()).toBe("2024-01-01T00:00:00.000Z");
    expect(f?.validTo).toBeNull();
    // sebelum faktor pertama berlaku -> tidak ada
    expect(await factors.findActiveForMode("truck_diesel", new Date("2023-12-31T00:00:00Z"))).toBeNull();
  });

  it("simpan lalu baca kembali (round-trip), dan menimpa saat dihitung ulang", async () => {
    const factor = (await factors.findActiveForMode("truck_diesel", new Date("2099-03-10T00:00:00Z")))!;
    const base = {
      shipmentId: ids.shipments[0]!, modeCode: "truck_diesel", emissionFactorId: factor.id,
      weightKg: 1850, distanceKm: 122, totalCo2eKg: 24.1499, method: "distance_based" as const,
      shipmentDate: new Date("2099-03-10T00:00:00Z"), calculatedAt: new Date("2099-03-10T01:00:00Z"),
    };
    await emissions.save(base);
    expect(await emissions.findByShipmentId(base.shipmentId)).toEqual(base);

    await emissions.save({ ...base, weightKg: 2000, totalCo2eKg: 26.108 });
    const again = await emissions.findByShipmentId(base.shipmentId);
    expect(again?.weightKg).toBe(2000);
    expect(again?.totalCo2eKg).toBe(26.108);
    const count = await pool.query(`SELECT COUNT(*)::int AS n FROM shipment_emissions WHERE shipment_id = $1`, [base.shipmentId]);
    expect(count.rows[0]).toEqual({ n: 1 });
  });

  it("menyimpan hasil untuk pengiriman yang tidak ada menghasilkan ShipmentNotFoundError (bukan error database mentah)", async () => {
    const factor = (await factors.findActiveForMode("truck_diesel", new Date("2099-03-10T00:00:00Z")))!;
    await expect(
      emissions.save({
        shipmentId: "99999999-9999-4999-8999-999999999999", modeCode: "truck_diesel", emissionFactorId: factor.id,
        weightKg: 100, distanceKm: 10, totalCo2eKg: 0.107, method: "distance_based",
        shipmentDate: new Date("2099-03-10T00:00:00Z"), calculatedAt: new Date("2099-03-10T01:00:00Z"),
      }),
    ).rejects.toBeInstanceOf(ShipmentNotFoundError);
  });

  it("use case end-to-end di atas PostgreSQL, termasuk rekap dengan rentang setengah-terbuka", async () => {
    const publisher = new SpyPublisher();
    const uc = buildUseCases({ modes, factors, emissions }, publisher, fixedClock);
    await uc.calculate.execute({ shipmentId: ids.shipments[1]!, modeCode: "truck_diesel", weightKg: 1000, distanceKm: 100, shipmentDate: new Date("2099-05-15T00:00:00Z") }); // 10,7
    await uc.calculate.execute({ shipmentId: ids.shipments[2]!, modeCode: "ship_cargo", weightKg: 3100, distanceKm: 310, shipmentDate: new Date("2099-05-20T00:00:00Z") }); // 7,688

    const s = await uc.getSummary.execute(new Date("2099-05-01T00:00:00Z"), new Date("2099-06-01T00:00:00Z"));
    expect(s.shipmentCount).toBe(2);
    expect(s.totalCo2eKg).toBe(18.388);
    expect(s.byMode.map((m) => m.modeCode)).toEqual(["truck_diesel", "ship_cargo"]);

    // batas akhir eksklusif: rentang yang berakhir tepat pada tanggal pengiriman tidak menghitungnya
    const edge = await uc.getSummary.execute(new Date("2099-05-01T00:00:00Z"), new Date("2099-05-15T00:00:00Z"));
    expect(edge.shipmentCount).toBe(0);
  });
});
