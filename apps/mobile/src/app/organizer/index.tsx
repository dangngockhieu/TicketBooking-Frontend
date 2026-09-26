import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { PlusCircle } from "lucide-react-native";
import { currentMonthKey, formatDate, formatVnd } from "@ticketbooking/shared";
import { MonthPicker } from "@/components/month-picker";
import { StatusBadge } from "@/components/status-badge";
import { useOrganizerDashboard, useOrganizerEvents } from "@/features/organizer/hooks";

export default function OrganizerDashboardScreen() {
  const [thisMonth] = useState(() => currentMonthKey());
  const [month, setMonth] = useState(thisMonth);
  const dashboard = useOrganizerDashboard(month);
  const recentEvents = useOrganizerEvents({ page: 1, size: 5 });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Tổng quan</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push("/organizer/events/new" as never)}
        >
          <PlusCircle size={16} color="#fff" />
          <Text style={styles.createButtonText}>Tạo sự kiện</Text>
        </TouchableOpacity>
      </View>

      <MonthPicker value={month} onChange={setMonth} max={thisMonth} />

      {dashboard.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : dashboard.isError || !dashboard.data ? (
        <TouchableOpacity onPress={() => dashboard.refetch()}>
          <Text style={styles.meta}>Không thể tải dữ liệu. Nhấn để thử lại.</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.section, dashboard.isPlaceholderData ? styles.dimmed : null]}>
          <View style={styles.kpiGrid}>
            {[
              { label: "Doanh thu ròng", value: formatVnd(dashboard.data.summary.netRevenue) },
              { label: "Doanh thu gộp", value: formatVnd(dashboard.data.summary.grossRevenue) },
              { label: "Phí nền tảng", value: formatVnd(dashboard.data.summary.platformFee) },
              {
                label: "Vé đã bán",
                value: dashboard.data.summary.totalTicketsSold.toLocaleString("vi-VN"),
              },
              {
                label: "Sự kiện đã diễn ra",
                value: dashboard.data.summary.eventsHeld.toLocaleString("vi-VN"),
              },
              {
                label: "Sự kiện sắp diễn ra",
                value: dashboard.data.summary.upcomingEvents.toLocaleString("vi-VN"),
              },
            ].map((tile) => (
              <View key={tile.label} style={styles.kpiTile}>
                <Text style={styles.kpiLabel}>{tile.label}</Text>
                <Text style={styles.kpiValue}>{tile.value}</Text>
              </View>
            ))}
          </View>

          {dashboard.data.topEvents.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sự kiện doanh thu cao nhất</Text>
              {dashboard.data.topEvents.map((event) => (
                <TouchableOpacity
                  key={event.eventId}
                  style={styles.topEventRow}
                  onPress={() =>
                    router.push({
                      pathname: "/organizer/events/[eventId]/report",
                      params: { eventId: event.eventId },
                    } as never)
                  }
                >
                  <Text style={styles.topEventTitle} numberOfLines={1}>
                    {event.eventTitle}
                  </Text>
                  <Text style={styles.meta}>
                    {event.ticketsSold.toLocaleString("vi-VN")} vé · {formatVnd(event.revenue)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sự kiện gần đây</Text>
        {recentEvents.isLoading ? (
          <ActivityIndicator />
        ) : recentEvents.isError ? (
          <TouchableOpacity onPress={() => recentEvents.refetch()}>
            <Text style={styles.meta}>Không thể tải. Nhấn để thử lại.</Text>
          </TouchableOpacity>
        ) : recentEvents.data && recentEvents.data.items.length > 0 ? (
          recentEvents.data.items.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventRow}
              onPress={() =>
                router.push({
                  pathname: "/organizer/events/[eventId]/edit",
                  params: { eventId: event.id },
                } as never)
              }
            >
              <View style={styles.eventRowInfo}>
                <Text style={styles.eventRowTitle}>{event.title}</Text>
                <Text style={styles.meta}>{formatDate(event.startTime)}</Text>
              </View>
              <StatusBadge status={event.status} />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.meta}>Chưa có sự kiện nào.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 22, fontWeight: "700", color: "#1d1d1f" },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#4f46e5",
  },
  createButtonText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 24 },
  section: { gap: 12 },
  dimmed: { opacity: 0.6 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#1d1d1f" },
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
  meta: { fontSize: 13, color: "#6b6b70" },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e5e5ea",
    borderRadius: 10,
    padding: 12,
  },
  eventRowInfo: { flex: 1, gap: 2 },
  eventRowTitle: { fontSize: 14, fontWeight: "600", color: "#1d1d1f" },
});
