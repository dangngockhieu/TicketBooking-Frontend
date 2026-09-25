import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { formatDate, formatVnd, type EventSummary } from "@ticketbooking/shared";
import { useCategories, useEvents } from "@/features/events/hooks";

const PAGE_SIZE = 20;

export default function EventListScreen() {
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const { data: categories } = useCategories();
  const {
    data: events,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useEvents({
    category: categoryId,
    size: PAGE_SIZE,
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={events?.items ?? []}
        keyExtractor={(event) => event.id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={
          categories && categories.length > 0 ? (
            <FlatList
              data={categories}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(c) => c.id}
              contentContainerStyle={styles.chipsRow}
              style={styles.chipsList}
              renderItem={({ item }) => {
                const active = categoryId === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.chip, active ? styles.chipActive : null]}
                    onPress={() => setCategoryId(active ? undefined : item.id)}
                  >
                    <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          ) : null
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator />
            </View>
          ) : isError ? (
            <View style={styles.center}>
              <Text style={styles.meta}>Không thể tải danh sách sự kiện.</Text>
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.meta}>Chưa có sự kiện nào.</Text>
            </View>
          )
        }
        renderItem={({ item }) => <EventCard event={item} />}
      />
    </View>
  );
}

function EventCard({ event }: { event: EventSummary }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: "/events/[eventId]", params: { eventId: event.id } })}
    >
      <View style={styles.banner}>
        {event.bannerUrl ? (
          <Image source={{ uri: event.bannerUrl }} style={styles.bannerImage} contentFit="cover" />
        ) : null}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.meta}>{event.location}</Text>
        <Text style={styles.meta}>{formatDate(event.startTime)}</Text>
        <Text style={styles.price}>Từ {formatVnd(event.minPrice)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 48 },
  list: { padding: 16, gap: 12 },
  chipsList: { marginBottom: 12 },
  chipsRow: { gap: 8, paddingBottom: 4 },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  chipText: { fontSize: 13, fontWeight: "500", color: "#1d1d1f" },
  chipTextActive: { color: "#fff" },
  card: {
    borderWidth: 1,
    borderColor: "#e5e5ea",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  banner: { aspectRatio: 16 / 9, backgroundColor: "#f2f2f7" },
  bannerImage: { width: "100%", height: "100%" },
  cardBody: { padding: 14, gap: 4 },
  title: { fontSize: 16, fontWeight: "600", color: "#1d1d1f" },
  meta: { fontSize: 13, color: "#6b6b70" },
  price: { fontSize: 14, fontWeight: "600", color: "#4f46e5", marginTop: 4 },
});
