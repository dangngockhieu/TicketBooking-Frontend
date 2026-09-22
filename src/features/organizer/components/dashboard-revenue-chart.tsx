"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatVnd } from "@/lib/format";
import type { OrganizerDashboardStats } from "@/types/api";

const GROSS_COLOR = "var(--color-primary)";
const NET_COLOR = "var(--color-success)";

export function OrganizerDashboardRevenueChart({
  data,
}: {
  data: OrganizerDashboardStats["revenueByDay"];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" />
          <XAxis dataKey="date" tick={{ fill: "var(--color-ink-muted-48)", fontSize: 12 }} />
          <YAxis tick={{ fill: "var(--color-ink-muted-48)", fontSize: 12 }} />
          <Tooltip formatter={(value) => formatVnd(Number(value))} />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            name="Doanh thu gộp"
            stroke={GROSS_COLOR}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="netRevenue"
            name="Doanh thu ròng"
            stroke={NET_COLOR}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
