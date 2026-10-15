/** Error domain: membawa `code` stabil agar layer HTTP bisa memetakannya tanpa membaca pesan. */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends DomainError {
  readonly code = "VALIDATION_ERROR";
}

export class UnknownTransportModeError extends DomainError {
  readonly code = "UNKNOWN_TRANSPORT_MODE";
  constructor(modeCode: string) {
    super(`Moda transportasi tidak dikenal: "${modeCode}"`);
  }
}

export class EmissionFactorNotFoundError extends DomainError {
  readonly code = "EMISSION_FACTOR_NOT_FOUND";
  constructor(modeCode: string, on: Date) {
    super(`Tidak ada faktor emisi aktif untuk moda "${modeCode}" pada ${on.toISOString().slice(0, 10)}`);
  }
}

export class ShipmentNotFoundError extends DomainError {
  readonly code = "SHIPMENT_NOT_FOUND";
  constructor(shipmentId: string) {
    super(`Pengiriman ${shipmentId} tidak ditemukan`);
  }
}

export class EmissionRecordNotFoundError extends DomainError {
  readonly code = "EMISSION_RECORD_NOT_FOUND";
  constructor(shipmentId: string) {
    super(`Belum ada hasil perhitungan emisi untuk pengiriman ${shipmentId}`);
  }
}
