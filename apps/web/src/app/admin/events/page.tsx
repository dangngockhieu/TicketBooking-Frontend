"use client";

import { Suspense, useEffect, useState } from "react";
import { Percent } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/common/status-badge";
import { DateTime } from "@/components/common/date-time";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientPagination } from "@/components/common/client-pagination";
import { usePageParam } from "@/lib/use-page-param";
import { cn } from "@/lib/utils";
import { useAllEventsAdmin } from "@/features/admin/hooks";
import { EventCommissionDialog } from "@/features/admin/components/event-commission-dialog";
import type { EventStatus } from "@ticketbooking/shared";

const PAGE_SIZE = 20;
const KEYWORD_DEBOUNCE_MS = 400;

const TABS: { label: string; value: EventStatus | undefined }[] = [
  { label: "Tất cả", value: undefined },
  { label: "Nháp", value: "DRAFT" },
  { label: "Đang bán", value: "PUBLISHED" },
  { label: "Đã hủy", value: "CANCELLED" },
  { label: "Đã diễn ra", value: "COMPLETED" },
];

export default function AdminEventsPage() {
  return (
    <Suspense>
      <AdminEventsContent />
    </Suspense>
  );
}

function AdminEventsContent() {
  const { page, setPage, setFilter, searchParams } = usePageParam();
  const status = (searchParams.get("status") as EventStatus | null) ?? undefined;
  const urlKeyword = searchParams.get("keyword") ?? "";

  const [keyword, setKeyword] = useState(urlKeyword);
  useEffect(() => {
    const id = setTimeout(() => {
      if (keyword !== urlKeyword) setFilter("keyword", keyword || undefined);
    }, KEYWORD_DEBOUNCE_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy lại khi keyword đổi, không phải khi urlKeyword đổi (tránh vòng lặp)
  }, [keyword]);

  const { data, isLoading, isError, refetch } = useAllEventsAdmin({
    status,
    keyword: urlKeyword || undefined,
    page,
    size: PAGE_SIZE,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sự kiện & phí nền tảng"
        description="Xem mọi sự kiện, sửa hoa hồng riêng khi cần."
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.label}
              role="tab"
              aria-selected={status === tab.value}
              onClick={() => setFilter("status", tab.value)}
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
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm theo tên sự kiện…"
          className="max-w-xs"
        />
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

      {data ? (
        <ClientPagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
      ) : null}
    </div>
  );
}
