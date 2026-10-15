import { ValidationError } from "../../domain/errors";
import type { EmissionSummary, ShipmentEmissionRepository } from "../ports";

const MAX_RANGE_DAYS = 366; // melindungi database dari query rentang tak terbatas
const DAY_MS = 86_400_000;

export class GetEmissionSummary {
  constructor(private readonly repository: ShipmentEmissionRepository) {}

  execute(from: Date, to: Date): Promise<EmissionSummary> {
    if (!(from < to)) throw new ValidationError("Parameter 'from' harus lebih awal dari 'to'");
    if ((to.getTime() - from.getTime()) / DAY_MS > MAX_RANGE_DAYS) {
      throw new ValidationError(`Rentang waktu maksimal ${MAX_RANGE_DAYS} hari`);
    }
    return this.repository.summarize(from, to);
  }
}
