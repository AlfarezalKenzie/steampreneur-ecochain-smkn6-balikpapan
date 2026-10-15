"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EmissionTrendPoint } from "@/lib/mock-data";
import { buildEmissionCsv, reportFileName } from "@/lib/report";

/**
 * Unduh CSV berjalan sepenuhnya di browser (Blob API) — fungsional nyata
 * di prototipe ini, bukan tombol statis. Format CSV dipilih (bukan PDF)
 * karena ini yang paling mudah dibuka admin di Excel, sesuai kebiasaan
 * kerja mereka saat ini (observasi: "dipindah ke Excel pada sore hari").
 */
export function DownloadReportButton({ data, month }: { data: EmissionTrendPoint[]; month: string }) {
  function handleDownload() {
    const blob = new Blob([buildEmissionCsv(data)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = reportFileName(month);
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="md" onClick={handleDownload}>
      <Download className="h-4 w-4" strokeWidth={2} />
      Unduh laporan (CSV)
    </Button>
  );
}
