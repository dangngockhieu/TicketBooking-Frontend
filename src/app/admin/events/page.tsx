"use client";

import { useState } from "react";
import { Percent } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/common/status-badge";
import { DateTime } from "@/components/common/date-time";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllEventsAdmin } from "@/features/admin/hooks";
import { EventCommissionDialog } from "@/features/admin/components/event-commission-dialog";

export default function AdminEventsPage() {
  const [keyword, setKeyword] = useState("");
  const { data, isLoading, isError, refetch } = useAllEventsAdmin({
    keyword: keyword || undefined,
    size: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sự kiện & phí nền tảng"
        description="Xem mọi sự kiện, sửa hoa hồng riêng khi cần."
      />

      <Input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="Tìm theo tên sự kiện…"
        className="max-w-xs"
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data && data.items.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-hairline bg-canvas">
          <table className="w-full text-sm">
            <thead className="bg-canvas-parchment text-left text-ink-muted-48">
              <tr>
                <th className="px-4 py-3">Sự kiện</th>
                <th className="px-4 py-3">Ngày diễn ra</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Phí nền tảng</th>
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
                    <StatusBadge status={event.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-muted-48">
                    {(event.commissionRate * 100).toFixed(1)}% +{" "}
                    {event.flatFeePerTicket.toLocaleString("vi-VN")}đ/vé
                  </td>
                  <td className="px-4 py-3 text-right">
                    <EventCommissionDialog
                      event={event}
                      trigger={
                        <Button variant="secondary" size="sm" className="gap-1">
                          <Percent className="h-3.5 w-3.5" aria-hidden />
                          Sửa phí
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Không có sự kiện nào" />
      )}
    </div>
  );
}
