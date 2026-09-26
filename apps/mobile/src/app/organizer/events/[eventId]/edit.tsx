import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { EventForm } from "@/features/organizer/components/event-form";
import { useOrganizerEvent, useUpdateEvent, usePublishEvent } from "@/features/organizer/hooks";

export default function EditEventScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { data: event, isLoading, isError } = useOrganizerEvent(eventId);
  const updateEvent = useUpdateEvent(eventId);
  const publishEvent = usePublishEvent();

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
    <EventForm
      initialEvent={event}
      onSave={(body) => updateEvent.mutateAsync(body)}
      onPublish={(id) => publishEvent.mutateAsync(id).then(() => undefined)}
      onDone={() => router.replace("/organizer/events" as never)}
      isSaving={updateEvent.isPending}
      isPublishing={publishEvent.isPending}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  meta: { fontSize: 14, color: "#6b6b70" },
});
