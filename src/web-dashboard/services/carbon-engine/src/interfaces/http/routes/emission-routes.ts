import { Router } from "express";
import { z } from "zod";
import { requirePermission } from "../middlewares/auth";
import type { EstimateEmission } from "../../../application/use-cases/estimate-emission";
import type { CalculateShipmentEmission } from "../../../application/use-cases/calculate-shipment-emission";
import type { GetShipmentEmission } from "../../../application/use-cases/get-shipment-emission";
import type { GetEmissionSummary } from "../../../application/use-cases/get-emission-summary";

export interface EmissionUseCases {
  estimate: EstimateEmission;
  calculate: CalculateShipmentEmission;
  getShipmentEmission: GetShipmentEmission;
  getSummary: GetEmissionSummary;
}

// Skema input: strictObject menolak field tak dikenal (sanitasi), string di-trim dan dibatasi polanya.
const emissionInput = {
  modeCode: z.string().trim().regex(/^[a-z][a-z0-9_]{1,29}$/, "Kode moda tidak valid"),
  weightKg: z.number().positive(),
  distanceKm: z.number().positive(),
  shipmentDate: z.iso.datetime({ offset: true }).optional(),
};
const estimateBody = z.strictObject(emissionInput);
const shipmentParams = z.object({ shipmentId: z.uuid() });
const summaryQuery = z.object({
  from: z.iso.datetime({ offset: true }),
  to: z.iso.datetime({ offset: true }),
});

const toDate = (iso: string | undefined): Date | undefined => (iso ? new Date(iso) : undefined);

export function emissionRoutes(uc: EmissionUseCases): Router {
  const router = Router();

  // Estimasi tanpa menyimpan: dipakai form "Catat Pengiriman" untuk pratinjau emisi real-time.
  router.post("/emissions/estimate", requirePermission("emission:read"), async (req, res) => {
    const body = estimateBody.parse(req.body);
    const result = await uc.estimate.execute({ ...body, shipmentDate: toDate(body.shipmentDate) });
    res.json({ data: result });
  });

  // Perhitungan resmi: idempoten per shipment (PUT = buat atau ganti hasil sebelumnya).
  router.put("/shipments/:shipmentId/emission", requirePermission("emission:recalculate"), async (req, res) => {
    const { shipmentId } = shipmentParams.parse(req.params);
    const body = estimateBody.parse(req.body);
    const result = await uc.calculate.execute({ shipmentId, ...body, shipmentDate: toDate(body.shipmentDate) });
    res.json({ data: result });
  });

  router.get("/shipments/:shipmentId/emission", requirePermission("emission:read"), async (req, res) => {
    const { shipmentId } = shipmentParams.parse(req.params);
    res.json({ data: await uc.getShipmentEmission.execute(shipmentId) });
  });

  // Rekap untuk Laporan Emisi. Catatan: tanda "+" pada offset zona waktu harus di-encode (%2B).
  router.get("/emissions/summary", requirePermission("emission:read"), async (req, res) => {
    const q = summaryQuery.parse(req.query);
    res.json({ data: await uc.getSummary.execute(new Date(q.from), new Date(q.to)) });
  });

  return router;
}
