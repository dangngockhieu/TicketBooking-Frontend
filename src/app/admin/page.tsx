"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/error-state";
import { EmptyState } from "@/components/common/empty-state";
import { Money } from "@/components/common/money";
import { cn } from "@/lib/utils";
import { useAdminDashboard } from "@/features/admin/hooks";
import { DashboardKpiTiles } from "@/features/admin/components/dashboard-kpi-tiles";
import { DashboardRevenueChart } from "@/features/admin/components/dashboard-revenue-chart";
import type { DashboardPeriod } from "@/types/api";

/** UC-A3: giám sát hệ thống — chỉ link ra công cụ ngoài (Grafana/Kafka UI), không có chức năng riêng. */
const MONITORING_LINKS = [
  { label: "Grafana", url: "http://localhost:3001", description: "Dashboard giám sát hệ thống" },
  {
    label: "Kafka UI",
    url: "http://localhost:8085",
    description: "Theo dõi topic & consumer group",
  },
];

const PERIOD_TABS: { label: string; value: DashboardPeriod }[] = [
  { label: "7 ngày qua", value: "WEEK" },
  { label: "30 ngày qua", value: "MONTH" },
];

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("MONTH");
  const { data: stats, isLoading, isError, refetch } = useAdminDashboard(period);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tổng quan hệ thống"
        description="Doanh thu, phí nền tảng và sự kiện đã diễn ra theo kỳ."
      />

      <div className="flex flex-wrap gap-2" role="tablist">
        {PERIOD_TABS.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={period === tab.value}
            onClick={() => setPeriod(tab.value)}
            className={cn(
              "rounded-pill px-4 py-2 text-sm font-medium",
              period === tab.value
                ? "bg-primary text-on-primary"
                : "border border-hairline bg-canvas text-ink-muted-80",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : isError || !stats ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <DashboardKpiTiles summary={stats.summary} />

          <Card className="p-5">
            <CardTitle className="mb-4">Doanh thu theo ngày</CardTitle>
            {stats.revenueByDay.length > 0 ? (
              <DashboardRevenueChart data={stats.revenueByDay} />
            ) : (
              <EmptyState title="Chưa có dữ liệu trong kỳ này" />
            )}
          </Card>

          <Card className="overflow-hidden p-0">
            <CardTitle className="px-5 pt-5">Sự kiện doanh thu cao nhất</CardTitle>
            {stats.topEvents.length > 0 ? (
              <table className="mt-4 w-full text-sm">
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
            ) : (
              <div className="p-5">
                <EmptyState title="Chưa có sự kiện nào trong kỳ này" />
              </div>
            )}
          </Card>
        </>
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
