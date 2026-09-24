"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/common/status-badge";
import { DateTime } from "@/components/common/date-time";
import { Money } from "@/components/common/money";
import { MonthPicker } from "@/components/common/month-picker";
import { currentMonthKey } from "@ticketbooking/shared";
import { cn } from "@/lib/utils";
import { useOrganizerDashboard, useOrganizerEvents } from "@/features/organizer/hooks";
import { OrganizerDashboardKpiTiles } from "@/features/organizer/components/dashboard-kpi-tiles";
import { OrganizerDashboardRevenueChart } from "@/features/organizer/components/dashboard-revenue-chart";

export default function OrganizerDashboardPage() {
  const [thisMonth] = useState(() => currentMonthKey());
  const [month, setMonth] = useState(thisMonth);
  const dashboard = useOrganizerDashboard(month);
  const recentEvents = useOrganizerEvents({ page: 1, size: 5 });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tổng quan"
        description="Doanh thu và sự kiện của bạn trong tháng, chia theo từng tuần"
        action={
          <Button asChild>
            <Link href="/organizer/events/new" className="gap-2">
              <PlusCircle className="h-4 w-4" aria-hidden />
              Tạo sự kiện
            </Link>
          </Button>
        }
      />

      <MonthPicker value={month} onChange={setMonth} max={thisMonth} />

      {dashboard.isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : dashboard.isError || !dashboard.data ? (
        <ErrorState onRetry={() => dashboard.refetch()} />
      ) : (
        <div
          className={cn(
            "flex flex-col gap-6 transition-opacity",
            dashboard.isPlaceholderData && "opacity-60",
          )}
        >
          <OrganizerDashboardKpiTiles summary={dashboard.data.summary} />

          <Card className="p-5">
            <CardTitle className="mb-4">Doanh thu theo tuần</CardTitle>
            {dashboard.data.revenueByWeek.some((week) => week.revenue > 0) ? (
              <OrganizerDashboardRevenueChart data={dashboard.data.revenueByWeek} />
            ) : (
              <EmptyState title="Chưa có doanh thu trong tháng này" />
            )}
          </Card>

          {dashboard.data.topEvents.length > 0 ? (
            <Card className="overflow-hidden p-0">
              <CardTitle className="px-5 pt-5">Sự kiện doanh thu cao nhất</CardTitle>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[28rem] text-sm">
                  <thead className="bg-canvas-parchment text-left text-ink-muted-48">
                    <tr>
                      <th className="px-5 py-3">Sự kiện</th>
                      <th className="px-5 py-3">Vé đã bán</th>
                      <th className="px-5 py-3">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.data.topEvents.map((event) => (
                      <tr key={event.eventId} className="border-t border-hairline">
                        <td className="px-5 py-3">
                          <Link
                            href={`/organizer/events/${event.eventId}/report`}
                            className="font-medium text-ink hover:underline"
                          >
                            {event.eventTitle}
                          </Link>
                        </td>
                        <td className="px-5 py-3">{event.ticketsSold.toLocaleString("vi-VN")}</td>
                        <td className="px-5 py-3">
                          <Money amount={event.revenue} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink">Sự kiện gần đây</h2>
        {recentEvents.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : recentEvents.isError ? (
          <ErrorState onRetry={() => recentEvents.refetch()} />
        ) : recentEvents.data && recentEvents.data.items.length > 0 ? (
          <div className="flex flex-col gap-3">
            {recentEvents.data.items.map((event) => (
              <Card key={event.id} className="flex items-center justify-between p-4">
                <div>
                  <Link
                    href={`/organizer/events/${event.id}/edit`}
                    className="font-medium text-ink hover:underline"
                  >
                    {event.title}
                  </Link>
                  <DateTime iso={event.startTime} className="block text-sm text-ink-muted-48" />
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={event.status} />
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/organizer/events/${event.id}/report`}>Báo cáo</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có sự kiện nào"
            description="Tạo sự kiện đầu tiên của bạn."
            action={
              <Button asChild>
                <Link href="/organizer/events/new">Tạo sự kiện</Link>
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
