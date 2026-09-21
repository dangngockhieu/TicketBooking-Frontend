"use client";

import { use } from "react";
import { useBooking } from "@/features/booking/hooks";
import { TicketQrCard } from "@/features/tickets/components/ticket-qr-card";
import { StatusBadge } from "@/components/common/status-badge";
import { DateTime } from "@/components/common/date-time";
import { Money } from "@/components/common/money";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/error-state";
import { formatDateTime } from "@/lib/format";

export default function BookingDetailPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const { data: booking, isLoading, isError, refetch } = useBooking(bookingId);

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (isError || !booking) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">{booking.event.title}</h1>
          <DateTime iso={booking.event.startTime} className="text-sm text-ink-muted-48" />
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="rounded-lg border border-hairline bg-canvas p-4">
        {booking.items.map((item) => (
          <div key={item.ticketClassId} className="flex justify-between py-1 text-sm">
            <span>
              {item.ticketClassName} × {item.quantity}
            </span>
            <Money amount={item.subtotal} />
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-hairline pt-2 font-semibold text-ink">
          <span>Tổng cộng</span>
          <Money amount={booking.totalAmount} />
        </div>
      </div>

      {booking.tickets.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {booking.tickets.map((ticket) => (
            <TicketQrCard
              key={ticket.id}
              ticket={ticket}
              checkedInAt={ticket.checkedInAt ? formatDateTime(ticket.checkedInAt) : null}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
