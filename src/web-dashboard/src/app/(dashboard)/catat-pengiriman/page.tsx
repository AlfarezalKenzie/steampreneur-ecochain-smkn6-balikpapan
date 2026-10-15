import { Topbar } from "@/components/layout/topbar";
import { ShipmentEntryForm } from "@/components/forms/shipment-entry-form";

export default function CatatPengirimanPage() {
  return (
    <div className="min-h-screen">
      <Topbar
        title="Catat Pengiriman"
        subtitle="Satu form untuk berat, tujuan, dan moda — menggantikan alur buku lalu pindah ke Excel"
      />
      <div className="p-6">
        <ShipmentEntryForm />
      </div>
    </div>
  );
}
