import { EmissionEstimator } from "./application/use-cases/emission-estimator";
import { EstimateEmission } from "./application/use-cases/estimate-emission";
import { CalculateShipmentEmission } from "./application/use-cases/calculate-shipment-emission";
import { GetShipmentEmission } from "./application/use-cases/get-shipment-emission";
import { GetEmissionSummary } from "./application/use-cases/get-emission-summary";
import type {
  Clock,
  EmissionFactorRepository,
  EventPublisher,
  ShipmentEmissionRepository,
  TransportModeRepository,
} from "./application/ports";
import type { EmissionUseCases } from "./interfaces/http/routes/emission-routes";

export interface Repositories {
  modes: TransportModeRepository;
  factors: EmissionFactorRepository;
  emissions: ShipmentEmissionRepository;
}

export const systemClock: Clock = { now: () => new Date() };

/** Satu-satunya tempat yang tahu cara merakit use case dari adapter (dipakai server & test). */
export function buildUseCases(repos: Repositories, events: EventPublisher, clock: Clock = systemClock): EmissionUseCases {
  const estimator = new EmissionEstimator(repos.modes, repos.factors);
  return {
    estimate: new EstimateEmission(estimator, clock),
    calculate: new CalculateShipmentEmission(estimator, repos.emissions, events, clock),
    getShipmentEmission: new GetShipmentEmission(repos.emissions),
    getSummary: new GetEmissionSummary(repos.emissions),
  };
}
