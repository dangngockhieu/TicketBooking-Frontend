import { StyleSheet, Text, View } from "react-native";

const LABEL: Record<string, string> = {
  connected: "Đã kết nối",
  connecting: "Đang kết nối",
  reconnecting: "Đang kết nối lại",
  lost: "Mất kết nối",
};

const DOT_COLOR: Record<string, string> = {
  connected: "#059669",
  connecting: "#d97706",
  reconnecting: "#d97706",
  lost: "#d92d20",
};

export function ConnectionIndicator({
  state,
}: {
  state: "connected" | "connecting" | "reconnecting" | "lost";
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: DOT_COLOR[state] }]} />
      <Text style={styles.label}>{LABEL[state]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 14, color: "#6b6b70" },
});
