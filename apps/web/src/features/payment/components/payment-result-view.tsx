"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, RotateCcw, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { bookingApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/common/error-state";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60_000;

/**
 * Poll GET /bookings/{id} tới khi có trạng thái cuối — KHÔNG tin vnp_ResponseCode
 * để kết luận, chỉ dùng để gợi ý hiển thị tạm. Xem docs/06-booking-payment-flow.md §1.
 */
export function PaymentResultView() {
  const searchParams = useSearchParams();
  const vnpTxnRef = searchParams.get("vnp_TxnRef");
  const vnpResponseCode = searchParams.get("vnp_ResponseCode");
  const [startedAt] = useState(() => Date.now());
  const [timedOut, setTimedOut] = useState(false);

  const bookingId =
    vnpTxnRef ??
    (typeof window !== "undefined" ? window.sessionStorage.getItem("lastBookingId") : null);

  const {
    data: booking,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: bookingId ? qk.booking(bookingId) : ["booking", "none"],
    queryFn: () => bookingApi.get(bookingId as string),
    enabled: !!bookingId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "PAID" || status === "REFUNDED" || status === "CANCELLED") return false;
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) return false;
      return POLL_INTERVAL_MS;
    },
  });

  useEffect(() => {
    const id = setTimeout(() => setTimedOut(true), POLL_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, []);

  if (!bookingId) {
    return <ErrorState message="Không xác định được đơn hàng cần kiểm tra." />;
  }
  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }
  if (isLoading || !booking) {
    return (
      <Center
        icon={<Clock className="h-12 w-12 animate-pulse text-ink-muted-48" />}
        title="Đang xác nhận thanh toán…"
      />
    );
  }

  if (booking.status === "PAID") {
    return (
      <Center
        icon={<CheckCircle2 className="h-12 w-12 text-success" />}
        title="Thanh toán thành công!"
        description="Vé đã được gửi tới email của bạn."
        action={
          <Button asChild>
            <Link href={`/me/bookings/${booking.id}`}>Xem vé</Link>
          </Button>
        }
      />
    );
  }

  if (booking.status === "REFUNDED") {
    return (
      <Center
        icon={<RotateCcw className="h-12 w-12 text-info" />}
        title="Đơn hàng đã được hoàn tiền"
        description="Vui lòng liên hệ hỗ trợ nếu bạn cần thêm thông tin."
      />
    );
  }

  if (booking.status === "CANCELLED") {
    return (
      <Center
        icon={<XCircle className="h-12 w-12 text-danger" />}
        title="Thanh toán thất bại"
        description={vnpResponseCode ? `Mã phản hồi VNPay: ${vnpResponseCode}` : undefined}
        action={
          <Button asChild variant="secondary">
            <Link href={`/events/${booking.event.id}`}>Quay lại sự kiện</Link>
          </Button>
        }
      />
    );
  }

  // PENDING_PAYMENT
  if (vnpResponseCode && vnpResponseCode !== "00") {
    return (
      <Center
        icon={<XCircle className="h-12 w-12 text-danger" />}
        title="Thanh toán chưa thành công"
        description="Đơn hàng vẫn còn hạn giữ chỗ, bạn có thể thanh toán lại."
        action={
          <Button asChild>
            <Link href={`/checkout/${booking.id}`}>Thanh toán lại</Link>
          </Button>
        }
      />
    );
  }

  if (timedOut) {
    return (
      <Center
        icon={<Clock className="h-12 w-12 text-warning" />}
        title="Chưa nhận được xác nhận"
        description="Giao dịch có thể đang được xử lý. Vui lòng kiểm tra lại sau ít phút."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => refetch()}>
              Kiểm tra lại
            </Button>
            <Button asChild>
              <Link href="/me/bookings">Vé của tôi</Link>
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <Center
      icon={<Clock className="h-12 w-12 animate-pulse text-ink-muted-48" />}
      title="Đang xác nhận thanh toán…"
    />
  );
}

function Center({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      {icon}
      <h1 className="text-xl font-semibold text-ink">{title}</h1>
      {description ? <p className="text-sm text-ink-muted-48">{description}</p> : null}
      {action}
    </div>
  );
}
