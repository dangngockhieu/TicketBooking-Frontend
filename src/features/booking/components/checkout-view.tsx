"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Countdown } from "@/components/common/countdown";
import { Money } from "@/components/common/money";
import { DateTime } from "@/components/common/date-time";
import { useBooking, useCancelBooking } from "@/features/booking/hooks";
import { useInitiatePayment } from "@/features/payment/hooks";
import { fallbackErrorMessage } from "@/lib/error-messages";
import { clearCart } from "@/features/booking/cart-storage";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/error-state";

export function CheckoutView({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { data: booking, isLoading, isError, refetch } = useBooking(bookingId);
  const cancelBooking = useCancelBooking();
  const initiatePayment = useInitiatePayment();
  const [expiredDialogOpen, setExpiredDialogOpen] = useState(false);

  if (isLoading) return <Skeleton className="mx-auto mt-10 h-80 max-w-3xl" />;
  if (isError || !booking) return <ErrorState onRetry={() => refetch()} />;

  if (booking.status === "PAID") {
    router.replace(`/me/bookings/${booking.id}`);
    return null;
  }
  if (booking.status === "CANCELLED") {
    return (
      <div className="mx-auto mt-10 max-w-md text-center">
        <p className="text-ink">Đơn hàng đã bị hủy hoặc hết thời gian giữ chỗ.</p>
        <Button className="mt-4" onClick={() => router.push(`/events/${booking.event.id}`)}>
          Quay lại sự kiện
        </Button>
      </div>
    );
  }

  async function handleCancel() {
    try {
      await cancelBooking.mutateAsync(bookingId);
      clearCart(booking!.event.id);
      toast.success("Đã hủy đơn hàng");
      router.push(`/events/${booking!.event.id}`);
    } catch (err) {
      toast.error(fallbackErrorMessage(err));
    }
  }

  async function handlePay() {
    try {
      const res = await initiatePayment.mutateAsync(bookingId);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("lastBookingId", bookingId);
      }
      window.location.assign(res.paymentUrl);
    } catch (err) {
      toast.error(fallbackErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between rounded-lg border border-hairline bg-canvas p-4">
        <span className="text-sm text-ink-muted-48">Giữ chỗ còn</span>
        <Countdown targetIso={booking.expiredAt} onExpire={() => setExpiredDialogOpen(true)} />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <div>
            <h2 className="font-semibold text-ink">{booking.event.title}</h2>
            <DateTime iso={booking.event.startTime} className="text-sm text-ink-muted-48" />
          </div>

          <div className="flex flex-col gap-1 border-t border-hairline pt-4">
            {booking.items.map((item) => (
              <div key={item.ticketClassId} className="flex justify-between text-sm text-ink">
                <span>
                  {item.ticketClassName} × {item.quantity}
                </span>
                <Money amount={item.subtotal} />
              </div>
            ))}
          </div>

          <div className="flex justify-between border-t border-hairline pt-4 text-base font-semibold text-ink">
            <span>Tổng cộng</span>
            <Money amount={booking.totalAmount} />
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button className="flex-1" size="lg" onClick={handlePay} disabled={initiatePayment.isPending}>
              {initiatePayment.isPending ? "Đang chuyển hướng…" : "Thanh toán qua VNPay"}
            </Button>
            <Button variant="secondary" onClick={handleCancel} disabled={cancelBooking.isPending}>
              Hủy đơn
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={expiredDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hết thời gian giữ chỗ</AlertDialogTitle>
            <AlertDialogDescription>
              Rất tiếc, thời gian giữ chỗ của bạn đã hết. Vui lòng chọn lại vé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => router.push(`/events/${booking.event.id}`)}>
              Quay lại sự kiện
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
