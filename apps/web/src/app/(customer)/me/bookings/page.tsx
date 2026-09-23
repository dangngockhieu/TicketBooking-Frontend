"use client";

import { useState } from "react";
import { useMyBookings } from "@/features/booking/hooks";
import { BookingCard } from "@/features/booking/components/booking-card";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types/api";

const TABS: { label: string; value: BookingStatus | undefined }[] = [
  { label: "Tất cả", value: undefined },
  { label: "Chờ thanh toán", value: "PENDING_PAYMENT" },
  { label: "Đã thanh toán", value: "PAID" },
  { label: "Đã hủy", value: "CANCELLED" },
  { label: "Hoàn tiền", value: "REFUNDED" },
];

export default function MyBookingsPage() {
  const [status, setStatus] = useState<BookingStatus | undefined>(undefined);
  const { data, isLoading, isError, refetch } = useMyBookings({ status, page: 1, size: 20 });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-ink">Vé của tôi</h1>

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
                : "bg-canvas text-ink-muted-80 border border-hairline",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data && data.items.length > 0 ? (
        <div className="flex flex-col gap-4">
          {data.items.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      ) : (
        <EmptyState title="Chưa có đơn hàng nào" description="Khám phá sự kiện và đặt vé ngay." />
      )}
    </div>
  );
}
