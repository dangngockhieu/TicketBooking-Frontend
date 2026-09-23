"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatVnd, formatVndCompact, formatWeekRange } from "@/lib/format";
import type { AdminDashboardStats } from "@/types/api";

const REVENUE_COLOR = "var(--color-primary)";
const FEE_COLOR = "var(--color-success)";

export function DashboardRevenueChart({ data }: { data: AdminDashboardStats["revenueByWeek"] }) {
  const rows = data.map((week) => ({
    ...week,
    label: formatWeekRange(week.weekStart, week.weekEnd),
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ left: 8, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" />
          <XAxis dataKey="label" tick={{ fill: "var(--color-ink-muted-48)", fontSize: 12 }} />
          <YAxis
            width={56}
            tickFormatter={formatVndCompact}
            tick={{ fill: "var(--color-ink-muted-48)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "var(--color-divider-soft)" }}
            formatter={(value) => formatVnd(Number(value))}
          />
          <Legend />
          <Bar dataKey="revenue" name="Doanh thu gộp" fill={REVENUE_COLOR} radius={[4, 4, 0, 0]} />
          <Bar dataKey="platformFee" name="Phí nền tảng" fill={FEE_COLOR} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
