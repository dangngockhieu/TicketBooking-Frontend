"use client";

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/common/status-badge";
import { DateTime } from "@/components/common/date-time";
import { useOrganizerEvents } from "@/features/organizer/hooks";

export default function OrganizerDashboardPage() {
  const { data, isLoading, isError, refetch } = useOrganizerEvents({ page: 1, size: 5 });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tổng quan"
        description="Sự kiện gần đây của bạn"
        action={
          <Button asChild>
            <Link href="/organizer/events/new" className="gap-2">
              <PlusCircle className="h-4 w-4" aria-hidden />
              Tạo sự kiện
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data && data.items.length > 0 ? (
        <div className="flex flex-col gap-3">
          {data.items.map((event) => (
            <Card key={event.id} className="flex items-center justify-between p-4">
              <div>
                <Link href={`/organizer/events/${event.id}/edit`} className="font-medium text-ink hover:underline">
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
  );
}
