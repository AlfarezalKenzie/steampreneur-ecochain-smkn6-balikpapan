import { EmissionRecordNotFoundError } from "../../domain/errors";
import type { ShipmentEmissionRecord, ShipmentEmissionRepository } from "../ports";

export class GetShipmentEmission {
  constructor(private readonly repository: ShipmentEmissionRepository) {}

  async execute(shipmentId: string): Promise<ShipmentEmissionRecord> {
    const record = await this.repository.findByShipmentId(shipmentId);
    if (!record) throw new EmissionRecordNotFoundError(shipmentId);
    return record;
  }
}
