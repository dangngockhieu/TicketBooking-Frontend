import { StyleSheet, Text, View } from "react-native";

export function QueuePosition({
  position,
  totalWaiting,
  estimatedWaitSeconds,
  initialPosition,
}: {
  position: number;
  totalWaiting: number;
  estimatedWaitSeconds: number;
  initialPosition: number;
}) {
  const progress =
    initialPosition > 0 ? Math.min(1, Math.max(0, 1 - position / initialPosition)) : 0;
  const etaMinutes = Math.max(1, Math.round(estimatedWaitSeconds / 60));

  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <Text style={styles.label}>Bạn đang ở vị trí</Text>
      <Text style={styles.position}>#{position.toLocaleString("vi-VN")}</Text>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>

      <Text style={styles.label}>Thời gian chờ ước tính: ~ {etaMinutes} phút</Text>
      <Text style={styles.label}>
        Tổng số người đang chờ: {totalWaiting.toLocaleString("vi-VN")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", alignItems: "center", gap: 10 },
  label: { fontSize: 14, color: "#6b6b70" },
  position: { fontSize: 36, fontWeight: "700", color: "#1d1d1f" },
  track: {
    width: "100%",
    maxWidth: 280,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f2ede4",
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 4, backgroundColor: "#4f46e5" },
});
