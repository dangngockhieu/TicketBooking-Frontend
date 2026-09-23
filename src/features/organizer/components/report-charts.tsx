"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatShortDate, formatVnd, formatVndCompact } from "@/lib/format";
import type { EventReport } from "@/types/api";

const CHART_COLOR = "#0066cc"; // colors.primary — .claude/DESIGN.md

export function ReportCharts({ report }: { report: EventReport }) {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink">Vé bán theo hạng</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <BarChart data={report.byTicketClass}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" />
              <XAxis dataKey="name" tick={{ fill: "var(--color-ink-muted-48)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--color-ink-muted-48)", fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="sold" name="Đã bán" fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
              <Bar
                dataKey="totalQuantity"
                name="Tổng số"
                fill="var(--color-hairline)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Bảng dữ liệu thay thế cho screen reader — xem docs/08-ui-design-system.md §7 */}
        <table className="sr-only">
          <caption>Vé bán theo hạng</caption>
          <thead>
            <tr>
              <th>Hạng vé</th>
              <th>Đã bán</th>
              <th>Tổng số</th>
              <th>Doanh thu</th>
            </tr>
          </thead>
          <tbody>
            {report.byTicketClass.map((tc) => (
              <tr key={tc.ticketClassId}>
                <td>{tc.name}</td>
                <td>{tc.sold}</td>
                <td>{tc.totalQuantity}</td>
                <td>{formatVnd(tc.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {report.salesByDay && report.salesByDay.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink">Doanh thu theo ngày</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <LineChart data={report.salesByDay} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
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
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke={CHART_COLOR}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : null}

      <section className="overflow-x-auto rounded-lg border border-hairline">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="bg-canvas-parchment text-left text-ink-muted-48">
            <tr>
              <th className="px-4 py-3">Hạng vé</th>
              <th className="px-4 py-3">Giá</th>
              <th className="px-4 py-3">Đã bán / Tổng</th>
              <th className="px-4 py-3">Check-in</th>
              <th className="px-4 py-3">Doanh thu</th>
            </tr>
          </thead>
          <tbody>
            {report.byTicketClass.map((tc) => (
              <tr key={tc.ticketClassId} className="border-t border-hairline">
                <td className="px-4 py-3">{tc.name}</td>
                <td className="px-4 py-3">{formatVnd(tc.price)}</td>
                <td className="px-4 py-3">
                  {tc.sold} / {tc.totalQuantity}
                </td>
                <td className="px-4 py-3">{tc.checkedIn}</td>
                <td className="px-4 py-3">{formatVnd(tc.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
