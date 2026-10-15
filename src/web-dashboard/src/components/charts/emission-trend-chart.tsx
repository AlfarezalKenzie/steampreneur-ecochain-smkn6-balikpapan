"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { EmissionTrendPoint } from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value as number;
  return (
    <div className="rounded-md border border-hairline bg-surface px-3 py-2 shadow-popover">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="font-mono text-sm font-medium text-ink">{formatNumber(value)} kg CO2e</p>
    </div>
  );
}

export function EmissionTrendChart({ data }: { data: EmissionTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="co2eFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F7A72" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#0F7A72" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#DDE3E0" strokeDasharray="0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#5B6B75" }}
          axisLine={{ stroke: "#DDE3E0" }}
          tickLine={false}
          interval={2}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#5B6B75" }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="totalCO2eKg"
          stroke="#0F7A72"
          strokeWidth={2}
          fill="url(#co2eFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
