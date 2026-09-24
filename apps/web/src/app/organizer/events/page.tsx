"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { DateTime } from "@/components/common/date-time";
import { Money } from "@/components/common/money";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useOrganizerEvents } from "@/features/organizer/hooks";
import type { EventStatus } from "@ticketbooking/shared";

const TABS: { label: string; value: EventStatus | undefined }[] = [
  { label: "Tất cả", value: undefined },
  { label: "Nháp", value: "DRAFT" },
  { label: "Đang bán", value: "PUBLISHED" },
  { label: "Đã hủy", value: "CANCELLED" },
  { label: "Đã diễn ra", value: "COMPLETED" },
];

export default function OrganizerEventsPage() {
  const [status, setStatus] = useState<EventStatus | undefined>(undefined);
  const { data, isLoading, isError, refetch } = useOrganizerEvents({ status, page: 1, size: 50 });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sự kiện của tôi"
        action={
          <Button asChild className="gap-2">
            <Link href="/organizer/events/new">
              <PlusCircle className="h-4 w-4" aria-hidden />
              Tạo sự kiện
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            role="tab"
            aria-selected={status === tab.value}
            onClick={() => setStatus(tab.value)}
            className={cn(
              "rounded-pill px-4 py-2 text-sm font-medium",
              status === tab.value
                ? "bg-primary text-on-primary"
                : "border border-hairline bg-canvas text-ink-muted-80",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data && data.items.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-hairline bg-canvas">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="bg-canvas-parchment text-left text-ink-muted-48">
              <tr>
                <th className="px-4 py-3">Sự kiện</th>
                <th className="px-4 py-3">Ngày diễn ra</th>
                <th className="px-4 py-3">Giá từ</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((event) => (
                <tr key={event.id} className="border-t border-hairline">
                  <td className="px-4 py-3 font-medium text-ink">{event.title}</td>
                  <td className="px-4 py-3">
                    <DateTime iso={event.startTime} />
                  </td>
                  <td className="px-4 py-3">
                    <Money amount={event.minPrice} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={event.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="secondary" size="sm">
                        <Link href={`/organizer/events/${event.id}/edit`}>Sửa</Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/organizer/events/${event.id}/report`}>Báo cáo</Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Chưa có sự kiện nào" />
      )}
    </div>
  );
}
