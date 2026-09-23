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
import { formatShortDate, formatVnd, formatVndCompact } from "@/lib/format";
import type { OrganizerDashboardStats } from "@/types/api";

const GROSS_COLOR = "var(--color-primary)";
const NET_COLOR = "var(--color-success)";

export function OrganizerDashboardRevenueChart({
  data,
}: {
  data: OrganizerDashboardStats["revenueByDay"];
}) {
  // Kỳ 30 ngày sẽ chi chít nhãn nếu hiện mọi ngày — chỉ hiện ~10 mốc.
  const tickInterval = data.length > 10 ? Math.ceil(data.length / 10) : 0;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: 8, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatShortDate}
            interval={tickInterval}
            tick={{ fill: "var(--color-ink-muted-48)", fontSize: 12 }}
          />
          <YAxis
            width={56}
            tickFormatter={formatVndCompact}
            tick={{ fill: "var(--color-ink-muted-48)", fontSize: 12 }}
          />
          <Tooltip
            labelFormatter={(label) => formatShortDate(String(label))}
            formatter={(value) => formatVnd(Number(value))}
          />
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
