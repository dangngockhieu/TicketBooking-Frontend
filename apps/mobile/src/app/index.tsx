import { FlatList, StyleSheet, Text, View } from "react-native";
import { formatDate, formatVnd, type EventSummary } from "@ticketbooking/shared";

/**
 * Danh sách sự kiện tĩnh — chỉ để chứng minh apps/mobile dùng chung được
 * contract type (EventSummary) và hàm format (formatVnd/formatDate) với apps/web
 * qua packages/shared. Sẽ thay bằng dữ liệu thật từ API khi có http client cho mobile.
 */
const SAMPLE_EVENTS: EventSummary[] = [
  {
    id: "evt-sample-1",
    title: "Đêm nhạc Acoustic Cuối Tuần",
    category: { id: "cat-1", name: "Âm nhạc", slug: "am-nhac" },
    location: "Hà Nội",
    venueName: "Hanoi Rock City",
    bannerUrl: null,
    startTime: "2026-10-15T19:00:00.000Z",
    endTime: "2026-10-15T22:00:00.000Z",
    saleStartTime: null,
    saleEndTime: null,
    status: "PUBLISHED",
    minPrice: 250_000,
    saleState: "ON_SALE",
  },
];

export default function EventListScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={SAMPLE_EVENTS}
        keyExtractor={(event) => event.id}
        contentContainerStyle={styles.list}
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
  list: { padding: 16, gap: 12 },
  card: { borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 12, padding: 16, gap: 4 },
  title: { fontSize: 16, fontWeight: "600" },
  meta: { fontSize: 13, color: "#666" },
  price: { fontSize: 14, fontWeight: "600", color: "#0066cc", marginTop: 4 },
});
