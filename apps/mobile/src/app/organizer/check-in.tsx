import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { CheckInScanner } from "@/features/organizer/components/check-in-scanner";
import { useOrganizerEvents } from "@/features/organizer/hooks";

export default function CheckInScreen() {
  const { data, isLoading } = useOrganizerEvents({ status: "PUBLISHED", size: 50 });
  const [eventId, setEventId] = useState("");

  const events = data?.items ?? [];
  const selected = eventId || events[0]?.id || "";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : events.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.meta}>Không có sự kiện đang bán để check-in.</Text>
        </View>
      ) : (
        <>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={selected} onValueChange={setEventId}>
              {events.map((e) => (
                <Picker.Item key={e.id} label={e.title} value={e.id} />
              ))}
            </Picker>
          </View>

          {selected ? <CheckInScanner key={selected} eventId={selected} /> : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16, gap: 14 },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 48 },
  meta: { fontSize: 14, color: "#6b6b70" },
  pickerWrapper: { borderWidth: 1, borderColor: "#d1d1d6", borderRadius: 10, overflow: "hidden" },
});
