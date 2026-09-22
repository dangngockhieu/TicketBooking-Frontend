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
import { formatVnd } from "@/lib/format";
import type { AdminDashboardStats } from "@/types/api";

const REVENUE_COLOR = "var(--color-primary)";
const FEE_COLOR = "var(--color-success)";

export function DashboardRevenueChart({ data }: { data: AdminDashboardStats["revenueByDay"] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" />
          <XAxis dataKey="date" tick={{ fill: "var(--color-ink-muted-48)", fontSize: 12 }} />
          <YAxis tick={{ fill: "var(--color-ink-muted-48)", fontSize: 12 }} />
          <Tooltip formatter={(value) => formatVnd(Number(value))} />
          <Legend />
          <Bar dataKey="revenue" name="Doanh thu gộp" fill={REVENUE_COLOR} radius={[4, 4, 0, 0]} />
          <Bar dataKey="platformFee" name="Phí nền tảng" fill={FEE_COLOR} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
