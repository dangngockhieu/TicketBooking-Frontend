import { StyleSheet, Text, View } from "react-native";

export default function CreateEventScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.meta}>Sắp ra mắt.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  meta: { fontSize: 14, color: "#6b6b70" },
});
