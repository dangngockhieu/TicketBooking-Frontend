import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { router, useLocalSearchParams } from "expo-router";
import { fallbackErrorMessage, formatDate, formatVnd } from "@ticketbooking/shared";
import { Countdown } from "@/components/countdown";
import { useBooking, useCancelBooking } from "@/features/booking/hooks";
import { useInitiatePayment } from "@/features/payment/hooks";
import { clearCart } from "@/features/booking/cart-storage";

export default function CheckoutScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { data: booking, isLoading, isError, refetch } = useBooking(bookingId);
  const cancelBooking = useCancelBooking();
  const initiatePayment = useInitiatePayment();
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (booking?.status === "PAID") {
      router.replace({
        pathname: "/tickets/[bookingId]",
        params: { bookingId: booking.id },
      } as never);
    }
  }, [booking]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  if (isError || !booking) {
    return (
      <View style={styles.center}>
        <TouchableOpacity onPress={() => refetch()}>
          <Text style={styles.meta}>Không thể tải đơn hàng. Nhấn để thử lại.</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (booking.status === "CANCELLED") {
    return (
      <View style={styles.center}>
        <Text style={styles.meta}>Đơn hàng đã bị hủy hoặc hết thời gian giữ chỗ.</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            router.replace({ pathname: "/events/[eventId]", params: { eventId: booking.event.id } })
          }
        >
          <Text style={styles.primaryButtonText}>Quay lại sự kiện</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleCancel() {
    setError(null);
    try {
      await cancelBooking.mutateAsync(bookingId);
      await clearCart(booking!.event.id);
      router.replace({ pathname: "/events/[eventId]", params: { eventId: booking!.event.id } });
    } catch (err) {
      setError(fallbackErrorMessage(err));
    }
  }

  async function handlePay() {
    setError(null);
    try {
      const res = await initiatePayment.mutateAsync(bookingId);
      const result = await WebBrowser.openAuthSessionAsync(
        res.paymentUrl,
        "ticketbooking://payment/result",
      );
      if (result.type === "success" && result.url) {
        const { queryParams } = Linking.parse(result.url);
        router.replace({
          pathname: "/payment/result",
          params: {
            orderId: String(queryParams?.orderId ?? bookingId),
            resultCode: String(queryParams?.resultCode ?? ""),
          },
        } as never);
      } else {
        // Người dùng đóng trình duyệt giữa chừng — vào thẳng màn kết quả để poll trạng thái thật.
        router.replace({ pathname: "/payment/result", params: { orderId: bookingId } } as never);
      }
    } catch (err) {
      setError(fallbackErrorMessage(err));
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.timerRow}>
        <Text style={styles.timerLabel}>Giữ chỗ còn</Text>
        <Countdown targetIso={booking.expiredAt} onExpire={() => setExpired(true)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.eventTitle}>{booking.event.title}</Text>
        <Text style={styles.meta}>{formatDate(booking.event.startTime)}</Text>

        <View style={styles.itemsList}>
          {booking.items.map((item) => (
            <View key={item.ticketClassId} style={styles.itemRow}>
              <Text style={styles.itemName}>
                {item.ticketClassName} × {item.quantity}
              </Text>
              <Text style={styles.itemPrice}>{formatVnd(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.totalValue}>{formatVnd(booking.totalAmount)}</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryButton, initiatePayment.isPending ? styles.disabled : null]}
          onPress={handlePay}
          disabled={initiatePayment.isPending || expired}
        >
          <Text style={styles.primaryButtonText}>
            {initiatePayment.isPending ? "Đang chuyển hướng…" : "Thanh toán qua MoMo"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, cancelBooking.isPending ? styles.disabled : null]}
          onPress={handleCancel}
          disabled={cancelBooking.isPending}
        >
          <Text style={styles.secondaryButtonText}>Hủy đơn</Text>
        </TouchableOpacity>
      </View>

      {expired ? (
        <View style={styles.expiredBanner}>
          <Text style={styles.expiredTitle}>Hết thời gian giữ chỗ</Text>
          <Text style={styles.meta}>
            Rất tiếc, thời gian giữ chỗ của bạn đã hết. Vui lòng chọn lại vé.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              router.replace({
                pathname: "/events/[eventId]",
                params: { eventId: booking.event.id },
              })
            }
          >
            <Text style={styles.primaryButtonText}>Quay lại sự kiện</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  center: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e5e5ea",
    borderRadius: 12,
    padding: 14,
  },
  timerLabel: { fontSize: 14, color: "#6b6b70" },
  card: {
    borderWidth: 1,
    borderColor: "#e5e5ea",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  eventTitle: { fontSize: 16, fontWeight: "600", color: "#1d1d1f" },
  meta: { fontSize: 13, color: "#6b6b70" },
  itemsList: { gap: 6, borderTopWidth: 1, borderTopColor: "#e5e5ea", paddingTop: 10 },
  itemRow: { flexDirection: "row", justifyContent: "space-between" },
  itemName: { fontSize: 14, color: "#1d1d1f" },
  itemPrice: { fontSize: 14, color: "#1d1d1f" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e5ea",
    paddingTop: 10,
  },
  totalLabel: { fontSize: 16, fontWeight: "600", color: "#1d1d1f" },
  totalValue: { fontSize: 16, fontWeight: "700", color: "#1d1d1f" },
  error: { fontSize: 13, color: "#d92d20" },
  primaryButton: {
    height: 50,
    borderRadius: 10,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  secondaryButton: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { fontSize: 14, fontWeight: "600", color: "#1d1d1f" },
  disabled: { opacity: 0.6 },
  expiredBanner: {
    gap: 10,
    borderWidth: 1,
    borderColor: "#f3d6d6",
    backgroundColor: "#fdf2f2",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  expiredTitle: { fontSize: 16, fontWeight: "600", color: "#d92d20" },
});
