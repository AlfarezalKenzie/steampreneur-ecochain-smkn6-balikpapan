"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Leaf, AlertCircle } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { TRANSPORT_MODES } from "@/lib/mock-data";
import { COMMON_ROUTES, CUSTOM_ROUTE_LABEL } from "@/lib/common-routes";
import { estimateCO2eKg } from "@/lib/emission";
import {
  EMPTY_FORM,
  canEstimate,
  parseWeightKg,
  resolveDistanceKm,
  validateShipmentForm,
  type FormState,
} from "@/lib/shipment-form";
import { formatNumber } from "@/lib/utils";

interface LoggedEntry {
  id: string;
  customerRef: string;
  routeLabel: string;
  distanceKm: number;
  weightKg: number;
  modeLabel: string;
  co2eKg: number;
  loggedAt: string;
}

/**
 * Form ini dirancang langsung menjawab 3 temuan lapangan:
 * 1. "Sering salah catat berat barang saat jam sibuk" → panel ringkasan
 *    besar muncul SEBELUM submit, jadi admin bisa cek ulang secara visual
 *    (bukan "tidak ada pengecekan ulang otomatis" seperti alur buku→Excel).
 * 2. "Field moda transportasi belum tercatat konsisten" → dibuat WAJIB,
 *    tidak bisa submit tanpa memilihnya.
 * 3. "Belum ada cara hitung emisi per pengiriman otomatis, masih estimasi
 *    kasar tahunan" → estimasi muncul real-time saat form diisi.
 */
export function ShipmentEntryForm() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [touched, setTouched] = useState(false);
  const [entries, setEntries] = useState<LoggedEntry[]>([]);

  const isCustomRoute = form.routeLabel === CUSTOM_ROUTE_LABEL;
  const selectedMode = TRANSPORT_MODES.find((m) => m.code === form.modeCode);
  const distanceKm = resolveDistanceKm(form);
  const weightKg = parseWeightKg(form);

  const errors = useMemo(() => validateShipmentForm(form), [form]);
  const isValid = Object.keys(errors).length === 0;

  // Estimasi tidak menunggu referensi pesanan: angkanya hanya bergantung pada tujuan, berat, dan moda.
  const estimatedCO2eKg =
    canEstimate(errors) && distanceKm !== null && weightKg !== null && selectedMode
      ? estimateCO2eKg(weightKg, distanceKm, selectedMode.factorKgCO2ePerTonKm)
      : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isValid || distanceKm === null || weightKg === null || !selectedMode || estimatedCO2eKg === null) return;

    const entry: LoggedEntry = {
      id: `ORD-${1000 + entries.length + 1}`,
      customerRef: form.customerRef,
      routeLabel: form.routeLabel,
      distanceKm,
      weightKg,
      modeLabel: selectedMode.label,
      co2eKg: estimatedCO2eKg,
      loggedAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };
    setEntries((prev) => [entry, ...prev]);
    setForm(EMPTY_FORM);
    setTouched(false);
  }

  return (
    <div className="grid grid-cols-5 gap-6">
      <form onSubmit={handleSubmit} noValidate className="col-span-3 space-y-4 rounded-lg border border-hairline bg-surface p-6">
        <Field label="Referensi pesanan / nama pelanggan" error={touched ? errors.customerRef : undefined}>
          <Input
            placeholder="mis. Bpk. Andi — pesanan WA pagi ini"
            value={form.customerRef}
            error={touched && !!errors.customerRef}
            onChange={(e) => setForm((f) => ({ ...f, customerRef: e.target.value }))}
          />
        </Field>

        <Field label="Tujuan pengiriman" error={touched ? errors.routeLabel : undefined}>
          <Select
            value={form.routeLabel}
            error={touched && !!errors.routeLabel}
            onChange={(e) => setForm((f) => ({ ...f, routeLabel: e.target.value, distanceKm: "" }))}
          >
            <option value="">Pilih tujuan...</option>
            {COMMON_ROUTES.map((r) => (
              <option key={r.label} value={r.label}>
                {r.label}
                {r.distanceKm ? ` (${r.distanceKm} km)` : ""}
              </option>
            ))}
          </Select>
        </Field>

        {isCustomRoute && (
          <Field label="Jarak tempuh (km)" error={touched ? errors.distanceKm : undefined}>
            <Input
              type="number"
              min={1}
              placeholder="mis. 250"
              value={form.distanceKm}
              error={touched && !!errors.distanceKm}
              onChange={(e) => setForm((f) => ({ ...f, distanceKm: e.target.value }))}
            />
          </Field>
        )}

        <Field
          label="Berat muatan (kg)"
          error={touched ? errors.weightKg : undefined}
          hint="Timbang dulu di gudang, lalu masukkan angkanya di sini."
        >
          <Input
            type="number"
            min={0.1}
            step={0.1}
            placeholder="mis. 420"
            value={form.weightKg}
            error={touched && !!errors.weightKg}
            onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))}
          />
        </Field>

        <Field label="Moda transportasi" error={touched ? errors.modeCode : undefined}>
          <Select
            value={form.modeCode}
            error={touched && !!errors.modeCode}
            onChange={(e) => setForm((f) => ({ ...f, modeCode: e.target.value }))}
          >
            <option value="">Pilih moda...</option>
            {TRANSPORT_MODES.map((m) => (
              <option key={m.code} value={m.code}>
                {m.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="pt-2">
          <Button type="submit" variant="teal" size="lg" className="w-full">
            <CheckCircle2 className="h-4 w-4" strokeWidth={2.25} />
            Catat pengiriman ini
          </Button>
        </div>
      </form>

      {/* Panel ringkasan & estimasi — ini "pengecekan ulang visual" yang
          selama ini tidak ada di alur buku → Excel. */}
      <div className="col-span-2 space-y-4">
        <div className="rounded-lg border border-hairline bg-ink p-6 text-white">
          <p className="text-sm text-white/60">Yang akan dicatat</p>

          {form.customerRef || form.routeLabel || form.weightKg || selectedMode ? (
            <div className="mt-3 space-y-2 text-sm">
              <SummaryRow label="Pelanggan" value={form.customerRef || "—"} />
              <SummaryRow label="Tujuan" value={form.routeLabel || "—"} />
              <SummaryRow label="Jarak" value={distanceKm ? `${formatNumber(distanceKm)} km` : "—"} />
              <SummaryRow label="Berat" value={weightKg !== null ? `${formatNumber(weightKg)} kg` : "—"} />
              <SummaryRow label="Moda" value={selectedMode?.label ?? "—"} />
            </div>
          ) : (
            <p className="mt-3 text-sm text-white/40">Mulai isi form untuk melihat ringkasan di sini.</p>
          )}

          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="flex items-center gap-1.5 text-sm text-white/60">
              <Leaf className="h-4 w-4 text-positive" strokeWidth={2} />
              Estimasi emisi
            </p>
            {estimatedCO2eKg !== null ? (
              <p className="mt-1 font-display text-3xl font-semibold tabular text-white">
                {formatNumber(estimatedCO2eKg, 2)} <span className="text-base font-normal text-white/50">kg CO2e</span>
              </p>
            ) : (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/40">
                <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} />
                Lengkapi tujuan, berat, dan moda untuk melihat estimasi.
              </p>
            )}
          </div>
        </div>

        {entries.length > 0 && (
          <div className="rounded-lg border border-hairline bg-surface p-5">
            <p className="mb-3 text-sm font-medium text-ink">Tercatat hari ini ({entries.length})</p>
            <div className="space-y-3">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-start justify-between border-b border-hairline pb-3 text-sm last:border-0 last:pb-0">
                  <div>
                    <p className="font-mono text-xs text-ink-faint">{entry.id} · {entry.loggedAt}</p>
                    <p className="text-ink">{entry.customerRef}</p>
                    <p className="text-xs text-ink-muted">{entry.routeLabel} · {entry.modeLabel}</p>
                  </div>
                  <p className="font-mono text-xs text-carbon">{formatNumber(entry.co2eKg, 2)} kg</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/50">{label}</span>
      <span className="text-right text-white">{value}</span>
    </div>
  );
}
