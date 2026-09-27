import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ExternalLink } from "lucide-react-native";
import { currentMonthKey, formatVnd } from "@ticketbooking/shared";
import { MonthPicker } from "@/components/month-picker";
import { useAdminDashboard } from "@/features/admin/hooks";

/** UC-A3: giám sát hệ thống — chỉ link ra công cụ ngoài (Grafana/Kafka UI), không có chức năng riêng. */
const MONITORING_LINKS = [
  { label: "Grafana", url: "http://localhost:3001", description: "Dashboard giám sát hệ thống" },
  {
    label: "Kafka UI",
    url: "http://localhost:8085",
    description: "Theo dõi topic & consumer group",
  },
];

export default function AdminDashboardScreen() {
  const [thisMonth] = useState(() => currentMonthKey());
  const [month, setMonth] = useState(thisMonth);
  const { data: stats, isLoading, isError, isPlaceholderData, refetch } = useAdminDashboard(month);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Tổng quan hệ thống</Text>
      <Text style={styles.description}>
        Doanh thu, phí nền tảng và sự kiện trong tháng, chia theo từng tuần.
      </Text>

      <MonthPicker value={month} onChange={setMonth} max={thisMonth} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : isError || !stats ? (
        <TouchableOpacity style={styles.center} onPress={() => refetch()}>
          <Text style={styles.meta}>Không thể tải dữ liệu. Nhấn để thử lại.</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.section, isPlaceholderData ? styles.dimmed : null]}>
          <View style={styles.kpiGrid}>
            {[
              { label: "Doanh thu gộp", value: formatVnd(stats.summary.totalRevenue) },
              { label: "Phí nền tảng", value: formatVnd(stats.summary.totalPlatformFee) },
              {
                label: "Vé đã bán",
                value: stats.summary.totalTicketsSold.toLocaleString("vi-VN"),
              },
              { label: "Sự kiện", value: stats.summary.eventsHeld.toLocaleString("vi-VN") },
              {
                label: "Organizer mới",
                value: stats.summary.newOrganizers.toLocaleString("vi-VN"),
              },
            ].map((tile) => (
              <View key={tile.label} style={styles.kpiTile}>
                <Text style={styles.kpiLabel}>{tile.label}</Text>
                <Text style={styles.kpiValue}>{tile.value}</Text>
              </View>
            ))}
          </View>

          {stats.topEvents.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sự kiện doanh thu cao nhất</Text>
              {stats.topEvents.map((event) => (
                <View key={event.eventId} style={styles.topEventRow}>
                  <Text style={styles.topEventTitle} numberOfLines={1}>
                    {event.eventTitle}
                  </Text>
                  <Text style={styles.meta}>{event.organizerEmail}</Text>
                  <Text style={styles.meta}>
                    {event.ticketsSold.toLocaleString("vi-VN")} vé · {formatVnd(event.revenue)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.meta}>Chưa có sự kiện nào trong tháng này.</Text>
          )}
        </View>
      )}

      <View style={styles.section}>
        {MONITORING_LINKS.map((link) => (
          <TouchableOpacity
            key={link.label}
            style={styles.linkCard}
            onPress={() => Linking.openURL(link.url)}
          >
            <View>
              <Text style={styles.linkTitle}>{link.label}</Text>
              <Text style={styles.meta}>{link.description}</Text>
            </View>
            <ExternalLink size={18} color="#6b6b70" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 24 },
  title: { fontSize: 22, fontWeight: "700", color: "#1d1d1f" },
  description: { fontSize: 13, color: "#6b6b70" },
  meta: { fontSize: 13, color: "#6b6b70" },
  section: { gap: 12 },
  dimmed: { opacity: 0.6 },
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
  topEventRow: { gap: 2, borderTopWidth: 1, borderTopColor: "#f2f2f7", paddingTop: 8 },
  topEventTitle: { fontSize: 14, fontWeight: "500", color: "#1d1d1f" },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e5e5ea",
    borderRadius: 10,
    padding: 14,
  },
  linkTitle: { fontSize: 14, fontWeight: "600", color: "#1d1d1f" },
});
