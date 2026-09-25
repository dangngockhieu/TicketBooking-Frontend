import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { bookingApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60_000;

/**
 * Poll GET /bookings/{id} tới khi có trạng thái cuối — KHÔNG tin resultCode trong
 * query param để kết luận, chỉ dùng để gợi ý hiển thị tạm trong lúc chờ. Xem
 * docs/06-booking-payment-flow.md §1 và ../TicketBooking/docs/api-design.md §5.3.
 */
export default function PaymentResultScreen() {
  const { orderId, resultCode } = useLocalSearchParams<{ orderId?: string; resultCode?: string }>();
  const [startedAt] = useState(() => Date.now());
  const [timedOut, setTimedOut] = useState(false);

  const bookingId = orderId ?? null;

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
    return <Center title="Không xác định được đơn hàng cần kiểm tra." />;
  }
  if (isError) {
    return (
      <Center
        title="Có lỗi xảy ra"
        action={
          <TouchableOpacity style={styles.secondaryButton} onPress={() => refetch()}>
            <Text style={styles.secondaryButtonText}>Kiểm tra lại</Text>
          </TouchableOpacity>
        }
      />
    );
  }
  if (isLoading || !booking) {
    return <Center title="Đang xác nhận thanh toán…" icon={<ActivityIndicator />} />;
  }

  if (booking.status === "PAID") {
    return (
      <Center
        title="Thanh toán thành công!"
        description="Vé đã được gửi tới email của bạn."
        action={
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              router.replace({
                pathname: "/tickets/[bookingId]",
                params: { bookingId: booking.id },
              } as never)
            }
          >
            <Text style={styles.primaryButtonText}>Xem vé</Text>
          </TouchableOpacity>
        }
      />
    );
  }

  if (booking.status === "REFUNDED") {
    return (
      <Center
        title="Đơn hàng đã được hoàn tiền"
        description="Vui lòng liên hệ hỗ trợ nếu bạn cần thêm thông tin."
      />
    );
  }

  if (booking.status === "CANCELLED") {
    return (
      <Center
        title="Thanh toán thất bại"
        description={resultCode ? `Mã phản hồi MoMo: ${resultCode}` : undefined}
        action={
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() =>
              router.replace({
                pathname: "/events/[eventId]",
                params: { eventId: booking.event.id },
              })
            }
          >
            <Text style={styles.secondaryButtonText}>Quay lại sự kiện</Text>
          </TouchableOpacity>
        }
      />
    );
  }

  // PENDING_PAYMENT
  if (resultCode && resultCode !== "0") {
    return (
      <Center
        title="Thanh toán chưa thành công"
        description="Đơn hàng vẫn còn hạn giữ chỗ, bạn có thể thanh toán lại."
        action={
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              router.replace({
                pathname: "/checkout/[bookingId]",
                params: { bookingId: booking.id },
              } as never)
            }
          >
            <Text style={styles.primaryButtonText}>Thanh toán lại</Text>
          </TouchableOpacity>
        }
      />
    );
  }

  if (timedOut) {
    return (
      <Center
        title="Chưa nhận được xác nhận"
        description="Giao dịch có thể đang được xử lý. Vui lòng kiểm tra lại sau ít phút."
        action={
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => refetch()}>
              <Text style={styles.secondaryButtonText}>Kiểm tra lại</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace("/tickets" as never)}
            >
              <Text style={styles.primaryButtonText}>Vé của tôi</Text>
            </TouchableOpacity>
          </View>
        }
      />
    );
  }

  return <Center title="Đang xác nhận thanh toán…" icon={<ActivityIndicator />} />;
}

function Center({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.container}>
      {icon}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 14,
  },
  title: { fontSize: 20, fontWeight: "700", color: "#1d1d1f", textAlign: "center" },
  description: { fontSize: 14, color: "#6b6b70", textAlign: "center" },
  actionRow: { flexDirection: "row", gap: 10 },
  primaryButton: {
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  secondaryButton: {
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { fontSize: 15, fontWeight: "600", color: "#1d1d1f" },
});
