import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useMyBookings } from "@/features/booking/hooks";
import { BookingCard } from "@/features/booking/components/booking-card";
import type { BookingStatus } from "@ticketbooking/shared";

const TABS: { label: string; value: BookingStatus | undefined }[] = [
  { label: "Tất cả", value: undefined },
  { label: "Chờ thanh toán", value: "PENDING_PAYMENT" },
  { label: "Đã thanh toán", value: "PAID" },
  { label: "Đã hủy", value: "CANCELLED" },
  { label: "Hoàn tiền", value: "REFUNDED" },
];

export default function MyBookingsScreen() {
  const [status, setStatus] = useState<BookingStatus | undefined>(undefined);
  const { data, isLoading, isError, refetch, isRefetching } = useMyBookings({
    status,
    page: 1,
    size: 20,
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(booking) => booking.id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={
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
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator />
            </View>
          ) : isError ? (
            <View style={styles.center}>
              <TouchableOpacity onPress={() => refetch()}>
                <Text style={styles.meta}>Không thể tải danh sách. Nhấn để thử lại.</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.meta}>Chưa có đơn hàng nào.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <BookingCard booking={item} />
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
  cardWrapper: { marginBottom: 12 },
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
  meta: { fontSize: 14, color: "#6b6b70" },
});
