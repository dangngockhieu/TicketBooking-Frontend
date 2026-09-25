import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { formatDate, formatDateTime, formatVnd } from "@ticketbooking/shared";
import { useBooking } from "@/features/booking/hooks";
import { StatusBadge } from "@/components/status-badge";
import { TicketQrCard } from "@/features/tickets/components/ticket-qr-card";

export default function BookingDetailScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { data: booking, isLoading, isError, refetch } = useBooking(bookingId);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{booking.event.title}</Text>
          <Text style={styles.meta}>{formatDate(booking.event.startTime)}</Text>
        </View>
        <StatusBadge status={booking.status} />
      </View>

      <View style={styles.card}>
        {booking.items.map((item) => (
          <View key={item.ticketClassId} style={styles.itemRow}>
            <Text style={styles.itemName}>
              {item.ticketClassName} × {item.quantity}
            </Text>
            <Text style={styles.itemPrice}>{formatVnd(item.subtotal)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.totalValue}>{formatVnd(booking.totalAmount)}</Text>
        </View>
      </View>

      {booking.tickets.length > 0 ? (
        <View style={styles.ticketsGrid}>
          {booking.tickets.map((ticket) => (
            <TicketQrCard
              key={ticket.id}
              ticket={ticket}
              checkedInAt={ticket.checkedInAt ? formatDateTime(ticket.checkedInAt) : null}
            />
          ))}
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
    padding: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  headerText: { flex: 1, gap: 4 },
  title: { fontSize: 18, fontWeight: "700", color: "#1d1d1f" },
  meta: { fontSize: 13, color: "#6b6b70" },
  card: {
    borderWidth: 1,
    borderColor: "#e5e5ea",
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  itemName: { fontSize: 14, color: "#1d1d1f" },
  itemPrice: { fontSize: 14, color: "#1d1d1f" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e5ea",
    marginTop: 6,
    paddingTop: 10,
  },
  totalLabel: { fontSize: 15, fontWeight: "600", color: "#1d1d1f" },
  totalValue: { fontSize: 15, fontWeight: "700", color: "#1d1d1f" },
  ticketsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
});
