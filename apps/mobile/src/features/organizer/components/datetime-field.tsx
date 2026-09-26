import { useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { formatDateTime } from "@ticketbooking/shared";

/** Chọn ngày giờ, lưu dạng ISO string trong form (khớp `new Date(...).toISOString()`
 * mà toRequest() cần) — tương đương `<input type="datetime-local">` của web. */
export function DateTimeField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const date = value ? new Date(value) : null;

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.input, error ? styles.inputError : null]}
        onPress={() => setOpen(true)}
      >
        <Text style={date ? styles.valueText : styles.placeholderText}>
          {date ? formatDateTime(value) : "Chọn ngày giờ"}
        </Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {open ? (
        <DateTimePicker
          value={date ?? new Date()}
          mode="datetime"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selected) => {
            setOpen(Platform.OS === "ios");
            if (event.type === "dismissed") {
              setOpen(false);
              return;
            }
            if (selected) onChange(selected.toISOString());
            if (Platform.OS === "android") setOpen(false);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 6 },
  label: { fontSize: 14, fontWeight: "500", color: "#1d1d1f" },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  inputError: { borderColor: "#d92d20" },
  valueText: { fontSize: 15, color: "#1d1d1f" },
  placeholderText: { fontSize: 15, color: "#8e8e93" },
  error: { fontSize: 13, color: "#d92d20" },
});
