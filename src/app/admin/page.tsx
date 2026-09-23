"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/error-state";
import { EmptyState } from "@/components/common/empty-state";
import { Money } from "@/components/common/money";
import { MonthPicker } from "@/components/common/month-picker";
import { currentMonthKey } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAdminDashboard } from "@/features/admin/hooks";
import { DashboardKpiTiles } from "@/features/admin/components/dashboard-kpi-tiles";
import { DashboardRevenueChart } from "@/features/admin/components/dashboard-revenue-chart";

/** UC-A3: giám sát hệ thống — chỉ link ra công cụ ngoài (Grafana/Kafka UI), không có chức năng riêng. */
const MONITORING_LINKS = [
  { label: "Grafana", url: "http://localhost:3001", description: "Dashboard giám sát hệ thống" },
  {
    label: "Kafka UI",
    url: "http://localhost:8085",
    description: "Theo dõi topic & consumer group",
  },
];

export default function AdminDashboardPage() {
  const [thisMonth] = useState(() => currentMonthKey());
  const [month, setMonth] = useState(thisMonth);
  const { data: stats, isLoading, isError, isPlaceholderData, refetch } = useAdminDashboard(month);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tổng quan hệ thống"
        description="Doanh thu, phí nền tảng và sự kiện trong tháng, chia theo từng tuần."
      />

      <MonthPicker value={month} onChange={setMonth} max={thisMonth} />

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : isError || !stats ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div
          className={cn(
            "flex flex-col gap-6 transition-opacity",
            isPlaceholderData && "opacity-60",
          )}
        >
          <DashboardKpiTiles summary={stats.summary} />

          <Card className="p-5">
            <CardTitle className="mb-4">Doanh thu theo tuần</CardTitle>
            {stats.revenueByWeek.some((week) => week.revenue > 0) ? (
              <DashboardRevenueChart data={stats.revenueByWeek} />
            ) : (
              <EmptyState title="Chưa có doanh thu trong tháng này" />
            )}
          </Card>

          <Card className="overflow-hidden p-0">
            <CardTitle className="px-5 pt-5">Sự kiện doanh thu cao nhất</CardTitle>
            {stats.topEvents.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[32rem] text-sm">
                  <thead className="bg-canvas-parchment text-left text-ink-muted-48">
                    <tr>
                      <th className="px-5 py-3">Sự kiện</th>
                      <th className="px-5 py-3">Organizer</th>
                      <th className="px-5 py-3">Vé đã bán</th>
                      <th className="px-5 py-3">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topEvents.map((event) => (
                      <tr key={event.eventId} className="border-t border-hairline">
                        <td className="px-5 py-3 font-medium text-ink">{event.eventTitle}</td>
                        <td className="px-5 py-3 text-ink-muted-48">{event.organizerEmail}</td>
                        <td className="px-5 py-3">{event.ticketsSold.toLocaleString("vi-VN")}</td>
                        <td className="px-5 py-3">
                          <Money amount={event.revenue} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-5">
                <EmptyState title="Chưa có sự kiện nào trong tháng này" />
              </div>
            )}
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MONITORING_LINKS.map((link) => (
          <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">
            <Card className="transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <CardTitle>{link.label}</CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </div>
                <ExternalLink className="h-5 w-5 text-ink-muted-48" aria-hidden />
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
