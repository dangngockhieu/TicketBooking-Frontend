import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { formatVnd } from "@ticketbooking/shared";
import { useEventReport } from "@/features/organizer/hooks";

export default function EventReportScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { data: report, isLoading, isError, refetch } = useEventReport(eventId);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  if (isError || !report) {
    return (
      <TouchableOpacity style={styles.center} onPress={() => refetch()}>
        <Text style={styles.meta}>Không thể tải báo cáo. Nhấn để thử lại.</Text>
      </TouchableOpacity>
    );
  }

  const tiles = [
    { label: "Doanh thu ròng", value: formatVnd(report.summary.netRevenue) },
    { label: "Doanh thu gộp", value: formatVnd(report.summary.totalRevenue) },
    { label: "Phí nền tảng", value: formatVnd(report.summary.totalPlatformFee) },
    { label: "Vé đã bán", value: report.summary.totalTicketsSold.toLocaleString("vi-VN") },
    { label: "Đã check-in", value: report.summary.totalTicketsCheckedIn.toLocaleString("vi-VN") },
    { label: "Tỷ lệ check-in", value: `${(report.summary.checkInRate * 100).toFixed(0)}%` },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{report.eventTitle}</Text>

      <View style={styles.kpiGrid}>
        {tiles.map((tile) => (
          <View key={tile.label} style={styles.kpiTile}>
            <Text style={styles.kpiLabel}>{tile.label}</Text>
            <Text style={styles.kpiValue}>{tile.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Theo hạng vé</Text>
        {report.byTicketClass.map((tc) => (
          <View key={tc.ticketClassId} style={styles.ticketRow}>
            <View style={styles.ticketInfo}>
              <Text style={styles.ticketName}>{tc.name}</Text>
              <Text style={styles.meta}>
                {tc.sold}/{tc.totalQuantity} vé · {tc.checkedIn} đã check-in
              </Text>
            </View>
            <Text style={styles.ticketRevenue}>{formatVnd(tc.revenue)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "700", color: "#1d1d1f" },
  meta: { fontSize: 13, color: "#6b6b70" },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpiTile: {
    width: "31%",
    borderWidth: 1,
    borderColor: "#e5e5ea",
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  kpiLabel: { fontSize: 11, color: "#6b6b70" },
  kpiValue: { fontSize: 15, fontWeight: "700", color: "#1d1d1f" },
  card: { borderWidth: 1, borderColor: "#e5e5ea", borderRadius: 12, padding: 14, gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#1d1d1f" },
  ticketRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f2f2f7",
    paddingTop: 8,
  },
  ticketInfo: { gap: 2 },
  ticketName: { fontSize: 14, fontWeight: "500", color: "#1d1d1f" },
  ticketRevenue: { fontSize: 14, fontWeight: "600", color: "#1d1d1f" },
});
