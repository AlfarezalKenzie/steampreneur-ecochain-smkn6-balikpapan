import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { buildUseCases } from "../../src/composition";
import { ShipmentNotFoundError } from "../../src/domain/errors";
import { createApp } from "../../src/interfaces/http/app";
import { createLogger } from "../../src/infrastructure/logger";
import { bearer, buildMemoryRepos, buildTestApp, fixedClock, request, SpyPublisher, testConfig, tokenFor } from "../helpers";

const SHIPMENT = "33333333-3333-4333-8333-333333333333";
const validBody = { modeCode: "truck_diesel", weightKg: 1850, distanceKm: 122 };

describe("probe", () => {
  it("/health tanpa autentikasi", async () => {
    const { app } = buildTestApp();
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("/ready 200 saat siap, 503 saat dependensi gagal (tanpa membocorkan detail)", async () => {
    const ok = buildTestApp({}, async () => true);
    expect((await request(ok.app).get("/ready")).status).toBe(200);

    const down = buildTestApp({}, async () => {
      throw new Error("connect ECONNREFUSED 10.0.0.5:5432");
    });
    const res = await request(down.app).get("/ready");
    expect(res.status).toBe(503);
    expect(JSON.stringify(res.body)).not.toContain("10.0.0.5");
  });
});

describe("autentikasi (JWT)", () => {
  const url = "/v1/emissions/estimate";

  it("401 tanpa token", async () => {
    const { app } = buildTestApp();
    const res = await request(app).post(url).send(validBody);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it.each([
    ["token acak", "Bearer abc.def.ghi"],
    ["skema bukan Bearer", "Basic dXNlcjpwYXNz"],
    ["secret salah", `Bearer ${tokenFor("ops_manager", { secret: "another-secret-another-secret-12345" })}`],
    ["issuer salah", `Bearer ${tokenFor("ops_manager", { issuer: "evil" })}`],
    ["audience salah", `Bearer ${tokenFor("ops_manager", { audience: "other-service" })}`],
    ["kedaluwarsa", `Bearer ${tokenFor("ops_manager", { expiresIn: -10 })}`],
  ])("401 untuk %s", async (_name, header) => {
    const { app } = buildTestApp();
    const res = await request(app).post(url).set("Authorization", header).send(validBody);
    expect(res.status).toBe(401);
  });

  it("401 untuk token dengan algoritma 'none' (serangan klasik)", async () => {
    const { app } = buildTestApp();
    const forged = jwt.sign({ role: "admin", permissions: ["emission:read"] }, "", {
      algorithm: "none",
      subject: "x",
      issuer: testConfig.jwt.issuer,
      audience: testConfig.jwt.audience,
    });
    const res = await request(app).post(url).set(bearer(forged)).send(validBody);
    expect(res.status).toBe(401);
  });

  it("endpoint /v1 yang tidak ada tetap menuntut autentikasi (tidak membocorkan daftar rute)", async () => {
    const { app } = buildTestApp();
    expect((await request(app).get("/v1/rahasia")).status).toBe(401);
    expect((await request(app).get("/v1/rahasia").set(bearer(tokenFor("ops_manager")))).status).toBe(404);
  });
});

describe("RBAC", () => {
  it("courier (tanpa emission:read) ditolak 403", async () => {
    const { app } = buildTestApp();
    const res = await request(app).post("/v1/emissions/estimate").set(bearer(tokenFor("courier"))).send(validBody);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("auditor boleh membaca/estimasi tapi tidak boleh menghitung ulang", async () => {
    const { app } = buildTestApp();
    const auditor = bearer(tokenFor("auditor"));
    expect((await request(app).post("/v1/emissions/estimate").set(auditor).send(validBody)).status).toBe(200);
    expect((await request(app).put(`/v1/shipments/${SHIPMENT}/emission`).set(auditor).send(validBody)).status).toBe(403);
  });
});

describe("POST /v1/emissions/estimate", () => {
  it("menghitung emisi dengan benar", async () => {
    const { app } = buildTestApp();
    const res = await request(app).post("/v1/emissions/estimate").set(bearer(tokenFor("ops_manager"))).send(validBody);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      modeCode: "truck_diesel",
      totalCo2eKg: 24.1499,
      factorKgCo2ePerTonKm: 0.107,
      warnings: [],
    });
  });

  it("menyertakan peringatan untuk berat tidak wajar", async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post("/v1/emissions/estimate")
      .set(bearer(tokenFor("ops_manager")))
      .send({ modeCode: "van_electric", weightKg: 5000, distanceKm: 10 });
    expect(res.status).toBe(200);
    expect(res.body.data.warnings[0].code).toBe("WEIGHT_EXCEEDS_MODE_CAPACITY");
  });

  it.each([
    ["berat negatif", { ...validBody, weightKg: -5 }],
    ["berat berupa string", { ...validBody, weightKg: "1850" }],
    ["jarak nol", { ...validBody, distanceKm: 0 }],
    ["kode moda berformat salah", { ...validBody, modeCode: "Truk Diesel; DROP TABLE" }],
    ["field tak dikenal", { ...validBody, isAdmin: true }],
    ["tanggal tidak valid", { ...validBody, shipmentDate: "kemarin" }],
    ["body kosong", {}],
  ])("422 untuk %s", async (_name, body) => {
    const { app } = buildTestApp();
    const res = await request(app).post("/v1/emissions/estimate").set(bearer(tokenFor("ops_manager"))).send(body);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });

  it("422 untuk moda yang tidak dikenal", async () => {
    const { app } = buildTestApp();
    const res = await request(app).post("/v1/emissions/estimate").set(bearer(tokenFor("ops_manager"))).send({ ...validBody, modeCode: "hovercraft" });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("UNKNOWN_TRANSPORT_MODE");
  });

  it("400 untuk JSON rusak dan 413 untuk body terlalu besar", async () => {
    const { app } = buildTestApp();
    const auth = bearer(tokenFor("ops_manager"));
    const broken = await request(app).post("/v1/emissions/estimate").set(auth).set("Content-Type", "application/json").send("{ bukan json");
    expect(broken.status).toBe(400);
    expect(broken.body.error.code).toBe("INVALID_JSON");

    const big = await request(app).post("/v1/emissions/estimate").set(auth).send({ ...validBody, modeCode: "a".repeat(20_000) });
    expect(big.status).toBe(413);
  });
});

describe("PUT/GET /v1/shipments/:id/emission", () => {
  it("menyimpan lalu membaca kembali hasil perhitungan, dan menerbitkan event", async () => {
    const { app, publisher } = buildTestApp();
    const auth = bearer(tokenFor("ops_manager"));

    const put = await request(app).put(`/v1/shipments/${SHIPMENT}/emission`).set(auth).send(validBody);
    expect(put.status).toBe(200);
    expect(put.body.data.shipmentId).toBe(SHIPMENT);

    const get = await request(app).get(`/v1/shipments/${SHIPMENT}/emission`).set(auth);
    expect(get.status).toBe(200);
    expect(get.body.data).toMatchObject({ shipmentId: SHIPMENT, totalCo2eKg: 24.1499, modeCode: "truck_diesel" });
    expect(publisher.events).toHaveLength(1);
  });

  it("404 jika belum pernah dihitung, 422 jika id bukan UUID", async () => {
    const { app } = buildTestApp();
    const auth = bearer(tokenFor("ops_manager"));
    const missing = await request(app).get(`/v1/shipments/${SHIPMENT}/emission`).set(auth);
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe("EMISSION_RECORD_NOT_FOUND");
    expect((await request(app).put("/v1/shipments/1;DROP/emission").set(auth).send(validBody)).status).toBe(422);
  });
});

describe("GET /v1/emissions/summary", () => {
  it("merekap emisi dalam rentang waktu (offset zona waktu di-encode)", async () => {
    const { app } = buildTestApp();
    const auth = bearer(tokenFor("ops_manager"));
    await request(app).put(`/v1/shipments/${SHIPMENT}/emission`).set(auth).send(validBody);
    await request(app).put("/v1/shipments/44444444-4444-4444-8444-444444444444/emission").set(auth).send({ modeCode: "ship_cargo", weightKg: 3100, distanceKm: 310 });

    const from = encodeURIComponent("2026-10-01T00:00:00+08:00");
    const to = encodeURIComponent("2026-11-01T00:00:00+08:00");
    const res = await request(app).get(`/v1/emissions/summary?from=${from}&to=${to}`).set(auth);
    expect(res.status).toBe(200);
    expect(res.body.data.shipmentCount).toBe(2);
    expect(res.body.data.totalCo2eKg).toBe(31.8379);
    expect(res.body.data.byMode[0].modeCode).toBe("truck_diesel");
  });

  it("422 jika parameter hilang atau rentang tidak valid", async () => {
    const { app } = buildTestApp();
    const auth = bearer(tokenFor("ops_manager"));
    expect((await request(app).get("/v1/emissions/summary").set(auth)).status).toBe(422);
    const res = await request(app).get("/v1/emissions/summary?from=2026-11-01T00:00:00Z&to=2026-10-01T00:00:00Z").set(auth);
    expect(res.status).toBe(422);
  });
});

describe("pengiriman tidak ditemukan", () => {
  it("PUT untuk pengiriman yang tidak ada mengembalikan 404 SHIPMENT_NOT_FOUND, bukan 500", async () => {
    const repos = buildMemoryRepos();
    repos.emissions.save = async () => {
      throw new ShipmentNotFoundError(SHIPMENT);
    };
    const app = createApp({
      config: testConfig,
      logger: createLogger("silent"),
      useCases: buildUseCases(repos, new SpyPublisher(), fixedClock),
      checkReady: async () => true,
    });
    const res = await request(app).put(`/v1/shipments/${SHIPMENT}/emission`).set(bearer(tokenFor("ops_manager"))).send(validBody);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("SHIPMENT_NOT_FOUND");
  });
});

describe("ketahanan & keamanan", () => {
  it("error tak terduga menjadi 500 generik tanpa membocorkan detail internal", async () => {
    const repos = buildMemoryRepos();
    repos.modes.findByCode = async () => {
      throw new Error("FATAL: password authentication failed for user svc_carbon at 10.1.2.3");
    };
    const app = createApp({
      config: testConfig,
      logger: createLogger("silent"),
      useCases: buildUseCases(repos, new SpyPublisher(), fixedClock),
      checkReady: async () => true,
    });
    const res = await request(app).post("/v1/emissions/estimate").set(bearer(tokenFor("ops_manager"))).send(validBody);
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain("10.1.2.3");
    expect(raw).not.toContain("password");
    expect(raw).not.toContain("at ");
  });

  it("rate limit: request melebihi batas mendapat 429", async () => {
    const { app } = buildTestApp({ rateLimitPerMinute: 3 });
    const auth = bearer(tokenFor("ops_manager"));
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) statuses.push((await request(app).post("/v1/emissions/estimate").set(auth).send(validBody)).status);
    expect(statuses).toEqual([200, 200, 200, 429, 429]);
  });

  it("header keamanan terpasang dan x-powered-by dihilangkan", async () => {
    const { app } = buildTestApp();
    const res = await request(app).get("/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(res.headers["strict-transport-security"]).toBeDefined();
  });

  it("x-request-id: diteruskan jika aman, diganti jika berisi karakter berbahaya", async () => {
    const { app } = buildTestApp();
    const safe = await request(app).get("/health").set("x-request-id", "abc-12345678");
    expect(safe.headers["x-request-id"]).toBe("abc-12345678");
    const unsafe = await request(app).get("/health").set("x-request-id", "<script>alert(1)</script>");
    expect(unsafe.headers["x-request-id"]).not.toContain("script");
    expect(unsafe.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });
});
