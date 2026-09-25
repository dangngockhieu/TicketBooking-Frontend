import { StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { StatusBadge } from "@/components/status-badge";
import type { Ticket } from "@ticketbooking/shared";

/** QR chỉ hiển thị rõ khi ISSUED; CHECKED_IN → mờ + giờ đã dùng. Xem docs/06 §5. */
export function TicketQrCard({
  ticket,
  checkedInAt,
}: {
  ticket: Ticket;
  checkedInAt: string | null;
}) {
  const used = ticket.status === "CHECKED_IN";

  return (
    <View style={styles.card}>
      <Text style={styles.name}>{ticket.ticketClassName}</Text>
      <StatusBadge status={ticket.status} />
      <View style={[styles.qrWrapper, used ? styles.qrWrapperUsed : null]}>
        <QRCode value={ticket.qrCodeData} size={200} />
      </View>
      {used && checkedInAt ? <Text style={styles.meta}>Đã sử dụng lúc {checkedInAt}</Text> : null}
      <Text style={styles.code}>Mã: {ticket.id.slice(0, 8).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e5e5ea",
    borderRadius: 12,
    padding: 20,
  },
  name: { fontSize: 15, fontWeight: "600", color: "#1d1d1f", textAlign: "center" },
  qrWrapper: { backgroundColor: "#fff", padding: 12, borderRadius: 8 },
  qrWrapperUsed: { opacity: 0.3 },
  meta: { fontSize: 13, color: "#6b6b70" },
  code: { fontSize: 12, color: "#6b6b70", fontFamily: "monospace" },
});
