import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { ShipmentsTable } from "@/components/dashboard/shipments-table";
import { recentShipments } from "@/lib/mock-data";

export default function ShipmentsPage() {
  const missingModeCount = recentShipments.filter((s) => s.mode === null).length;

  return (
    <div className="min-h-screen">
      <Topbar
        title="Riwayat Pengiriman"
        subtitle={
          missingModeCount > 0
            ? `${missingModeCount} pesanan belum lengkap datanya — perlu dilengkapi agar masuk laporan emisi`
            : "Semua pesanan sudah lengkap datanya"
        }
      />
      <div className="p-6">
        <Card>
          <ShipmentsTable rows={recentShipments} />
        </Card>
      </div>
    </div>
  );
}
