import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { ApiError, formatDate, formatVnd, type EventSummary } from "@ticketbooking/shared";
import { catalogApi } from "@/lib/api";

/**
 * Danh sách sự kiện — chứng minh apps/mobile gọi được API thật qua lib/api.ts
 * (http-client.ts riêng của mobile, dùng chung contract type/format từ
 * packages/shared với apps/web). Chưa dùng TanStack Query — màn hình khác khi
 * cần cache/retry thật sự nên thêm nó, tránh kéo thêm phụ thuộc cho 1 màn demo.
 */
export default function EventListScreen() {
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    catalogApi
      .getEvents({ size: 20 })
      .then((res) => {
        if (!cancelled) setEvents(res.items);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Không thể tải danh sách sự kiện.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.meta}>{error}</Text>
      </View>
    );
  }

  if (!events) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(event) => event.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.meta}>Chưa có sự kiện nào.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>{item.location}</Text>
            <Text style={styles.meta}>{formatDate(item.startTime)}</Text>
            <Text style={styles.price}>Từ {formatVnd(item.minPrice)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  list: { padding: 16, gap: 12 },
  card: { borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 12, padding: 16, gap: 4 },
  title: { fontSize: 16, fontWeight: "600" },
  meta: { fontSize: 13, color: "#666" },
  price: { fontSize: 14, fontWeight: "600", color: "#0066cc", marginTop: 4 },
});
