import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Percent } from "lucide-react-native";
import { formatDate } from "@ticketbooking/shared";
import { StatusBadge } from "@/components/status-badge";
import { EventCommissionDialog } from "@/features/admin/components/event-commission-dialog";
import { useAllEventsAdmin } from "@/features/admin/hooks";
import type { EventStatus } from "@ticketbooking/shared";

const TABS: { label: string; value: EventStatus | undefined }[] = [
  { label: "Tất cả", value: undefined },
  { label: "Nháp", value: "DRAFT" },
  { label: "Đang bán", value: "PUBLISHED" },
  { label: "Đã hủy", value: "CANCELLED" },
  { label: "Đã diễn ra", value: "COMPLETED" },
];

export default function AdminEventsScreen() {
  const [status, setStatus] = useState<EventStatus | undefined>(undefined);
  const [keyword, setKeyword] = useState("");
  const { data, isLoading, isError, refetch, isRefetching } = useAllEventsAdmin({
    status,
    keyword: keyword || undefined,
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
            <TextInput
              value={keyword}
              onChangeText={setKeyword}
              placeholder="Tìm theo tên sự kiện…"
              style={styles.searchInput}
            />
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
              <Text style={styles.meta}>Không có sự kiện nào.</Text>
            </View>
          )
        }
        renderItem={({ item: event }) => (
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {event.title}
              </Text>
              <Text style={styles.meta}>{formatDate(event.startTime)}</Text>
              <StatusBadge status={event.status} />
              <Text style={styles.meta}>
                {(event.commissionRate * 100).toFixed(1)}% +{" "}
                {event.flatFeePerTicket.toLocaleString("vi-VN")}đ/vé
              </Text>
            </View>
            <EventCommissionDialog
              event={event}
              trigger={
                <View style={styles.commissionButton}>
                  <Percent size={13} color="#1d1d1f" />
                  <Text style={styles.commissionButtonText}>Sửa phí</Text>
                </View>
              }
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 48 },
  list: { padding: 16 },
  meta: { fontSize: 13, color: "#6b6b70" },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 12,
  },
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
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e5e5ea",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardInfo: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#1d1d1f" },
  commissionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d1d6",
  },
  commissionButtonText: { fontSize: 12, fontWeight: "600", color: "#1d1d1f" },
});
