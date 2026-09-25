import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { MapPin } from "lucide-react-native";
import { formatDate } from "@ticketbooking/shared";
import { useEvent } from "@/features/events/hooks";
import { TicketSelector } from "@/features/booking/components/ticket-selector";

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { data: event, isLoading, isError } = useEvent(eventId);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isError || !event) {
    return (
      <View style={styles.center}>
        <Text style={styles.meta}>Không tìm thấy sự kiện.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.banner}>
        {event.bannerUrl ? (
          <Image source={{ uri: event.bannerUrl }} style={styles.bannerImage} contentFit="cover" />
        ) : null}
      </View>

      <Text style={styles.category}>{event.category.name}</Text>
      <Text style={styles.title}>{event.title}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>{formatDate(event.startTime)}</Text>
        <View style={styles.metaLine}>
          <MapPin size={14} color="#6b6b70" />
          <Text style={styles.meta}>
            {event.venueName ? `${event.venueName}, ` : ""}
            {event.location}
          </Text>
        </View>
      </View>

      {event.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Giới thiệu</Text>
          <Text style={styles.description}>{event.description}</Text>
        </View>
      ) : null}

      <TicketSelector event={event} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  banner: {
    aspectRatio: 16 / 9,
    backgroundColor: "#f2f2f7",
    borderRadius: 12,
    overflow: "hidden",
  },
  bannerImage: { width: "100%", height: "100%" },
  category: { fontSize: 14, fontWeight: "600", color: "#4f46e5" },
  title: { fontSize: 22, fontWeight: "700", color: "#1d1d1f" },
  metaRow: { gap: 4 },
  metaLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  meta: { fontSize: 13, color: "#6b6b70" },
  section: { gap: 6, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#1d1d1f" },
  description: { fontSize: 14, color: "#3c3c43", lineHeight: 20 },
});
