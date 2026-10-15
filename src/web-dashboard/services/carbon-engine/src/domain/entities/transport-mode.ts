export interface TransportMode {
  readonly code: string;
  readonly displayName: string;
  /** null = tidak ada batas yang dikenal. */
  readonly maxPayloadKg: number | null;
}
