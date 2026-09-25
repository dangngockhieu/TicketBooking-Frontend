import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { formatDate, formatVnd, type Booking } from "@ticketbooking/shared";
import { StatusBadge } from "@/components/status-badge";
import { Countdown } from "@/components/countdown";

export function BookingCard({ booking }: { booking: Booking }) {
  // Đơn PENDING_PAYMENT nhưng đã hết hạn giữ chỗ sẽ được backend chuyển CANCELLED
  // ở lần fetch kế tiếp; Countdown tự ẩn khi remaining <= 0.
  const canContinuePayment = booking.status === "PENDING_PAYMENT";

  return (
    <View style={styles.card}>
      <View style={styles.banner}>
        {booking.event.bannerUrl ? (
          <Image
            source={{ uri: booking.event.bannerUrl }}
            style={styles.bannerImage}
            contentFit="cover"
          />
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {booking.event.title}
          </Text>
          <StatusBadge status={booking.status} />
        </View>
        <Text style={styles.meta}>{formatDate(booking.event.startTime)}</Text>
        <Text style={styles.meta}>{booking.event.location}</Text>
        <Text style={styles.amount}>
          {formatVnd(booking.totalAmount)} · {booking.quantity} vé
        </Text>

        {canContinuePayment ? (
          <View style={styles.actionColumn}>
            <Countdown targetIso={booking.expiredAt} />
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                router.push({
                  pathname: "/checkout/[bookingId]",
                  params: { bookingId: booking.id },
                } as never)
              }
            >
              <Text style={styles.primaryButtonText}>Tiếp tục thanh toán</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() =>
              router.push({
                pathname: "/tickets/[bookingId]",
                params: { bookingId: booking.id },
              } as never)
            }
          >
            <Text style={styles.secondaryButtonText}>Xem chi tiết</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#e5e5ea",
    borderRadius: 12,
    overflow: "hidden",
  },
  banner: { aspectRatio: 16 / 9, backgroundColor: "#f2f2f7" },
  bannerImage: { width: "100%", height: "100%" },
  body: { padding: 14, gap: 4 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  title: { flex: 1, fontSize: 15, fontWeight: "600", color: "#1d1d1f" },
  meta: { fontSize: 13, color: "#6b6b70" },
  amount: { fontSize: 14, fontWeight: "600", color: "#1d1d1f", marginTop: 2 },
  actionColumn: { gap: 8, marginTop: 8, alignItems: "flex-start" },
  primaryButton: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  secondaryButton: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    marginTop: 8,
  },
  secondaryButtonText: { fontSize: 13, fontWeight: "600", color: "#1d1d1f" },
});
