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
import { formatShortDate, formatVnd, formatVndCompact } from "@/lib/format";
import type { AdminDashboardStats } from "@/types/api";

const REVENUE_COLOR = "var(--color-primary)";
const FEE_COLOR = "var(--color-success)";

export function DashboardRevenueChart({ data }: { data: AdminDashboardStats["revenueByDay"] }) {
  // Kỳ 30 ngày sẽ chi chít nhãn nếu hiện mọi ngày — chỉ hiện ~10 mốc.
  const tickInterval = data.length > 10 ? Math.ceil(data.length / 10) : 0;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: 8, right: 8 }}>
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
          <Bar dataKey="revenue" name="Doanh thu gộp" fill={REVENUE_COLOR} radius={[4, 4, 0, 0]} />
          <Bar dataKey="platformFee" name="Phí nền tảng" fill={FEE_COLOR} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
