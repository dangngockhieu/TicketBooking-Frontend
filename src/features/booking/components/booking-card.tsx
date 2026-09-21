import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/common/money";
import { DateTime } from "@/components/common/date-time";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/common/countdown";
import type { Booking } from "@/types/api";

export function BookingCard({ booking }: { booking: Booking }) {
  // Đơn PENDING_PAYMENT nhưng đã hết hạn giữ chỗ sẽ được backend chuyển CANCELLED
  // ở lần fetch kế tiếp; Countdown tự ẩn khi remaining <= 0.
  const canContinuePayment = booking.status === "PENDING_PAYMENT";

  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-md bg-canvas-parchment sm:w-40">
        {booking.event.bannerUrl ? (
          <Image src={booking.event.bannerUrl} alt={booking.event.title} fill className="object-cover" />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-ink">{booking.event.title}</h3>
          <StatusBadge status={booking.status} />
        </div>
        <DateTime iso={booking.event.startTime} className="text-sm text-ink-muted-48" />
        <p className="text-sm text-ink-muted-48">{booking.event.location}</p>
        <p className="font-semibold text-ink">
          <Money amount={booking.totalAmount} /> · {booking.quantity} vé
        </p>
      </div>

      <div className="flex flex-col items-end gap-2">
        {canContinuePayment ? (
          <>
            <Countdown targetIso={booking.expiredAt} />
            <Button asChild size="sm">
              <Link href={`/checkout/${booking.id}`}>Tiếp tục thanh toán</Link>
            </Button>
          </>
        ) : (
          <Button asChild variant="secondary" size="sm">
            <Link href={`/me/bookings/${booking.id}`}>Xem chi tiết</Link>
          </Button>
        )}
      </div>
    </Card>
  );
}
