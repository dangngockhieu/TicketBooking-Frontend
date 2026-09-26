import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { PlusCircle } from "lucide-react-native";
import { formatDate, formatVnd } from "@ticketbooking/shared";
import { StatusBadge } from "@/components/status-badge";
import { useOrganizerEvents } from "@/features/organizer/hooks";
import type { EventStatus } from "@ticketbooking/shared";

const TABS: { label: string; value: EventStatus | undefined }[] = [
  { label: "Tất cả", value: undefined },
  { label: "Nháp", value: "DRAFT" },
  { label: "Đang bán", value: "PUBLISHED" },
  { label: "Đã hủy", value: "CANCELLED" },
  { label: "Đã diễn ra", value: "COMPLETED" },
];

export default function OrganizerEventsScreen() {
  const [status, setStatus] = useState<EventStatus | undefined>(undefined);
  const { data, isLoading, isError, refetch, isRefetching } = useOrganizerEvents({
    status,
    page: 1,
    size: 50,
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(event) => event.id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={
          <>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push("/organizer/events/new" as never)}
            >
              <PlusCircle size={16} color="#fff" />
              <Text style={styles.createButtonText}>Tạo sự kiện</Text>
            </TouchableOpacity>
            <FlatList
              data={TABS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(tab) => tab.label}
              contentContainerStyle={styles.tabsRow}
              style={styles.tabsList}
              renderItem={({ item }) => {
                const active = status === item.value;
                return (
                  <TouchableOpacity
                    style={[styles.tab, active ? styles.tabActive : null]}
                    onPress={() => setStatus(item.value)}
                  >
                    <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator />
            </View>
          ) : isError ? (
            <TouchableOpacity style={styles.center} onPress={() => refetch()}>
              <Text style={styles.meta}>Không thể tải. Nhấn để thử lại.</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.center}>
              <Text style={styles.meta}>Chưa có sự kiện nào.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/organizer/events/[eventId]/edit",
                params: { eventId: item.id },
              } as never)
            }
          >
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.meta}>{formatDate(item.startTime)}</Text>
              <Text style={styles.price}>Từ {formatVnd(item.minPrice)}</Text>
            </View>
            <View style={styles.cardActions}>
              <StatusBadge status={item.status} />
              <TouchableOpacity
                style={styles.reportButton}
                onPress={() =>
                  router.push({
                    pathname: "/organizer/events/[eventId]/report",
                    params: { eventId: item.id },
                  } as never)
                }
              >
                <Text style={styles.reportButtonText}>Báo cáo</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 48 },
  list: { padding: 16, gap: 12 },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#4f46e5",
    marginBottom: 12,
  },
  createButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  tabsList: { marginBottom: 12 },
  tabsRow: { gap: 8, paddingBottom: 4 },
  tab: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  tabText: { fontSize: 13, fontWeight: "500", color: "#1d1d1f" },
  tabTextActive: { color: "#fff" },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e5e5ea",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardInfo: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#1d1d1f" },
  meta: { fontSize: 13, color: "#6b6b70" },
  price: { fontSize: 14, fontWeight: "600", color: "#4f46e5" },
  cardActions: { alignItems: "flex-end", gap: 8 },
  reportButton: {
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    alignItems: "center",
    justifyContent: "center",
  },
  reportButtonText: { fontSize: 12, fontWeight: "600", color: "#1d1d1f" },
});
