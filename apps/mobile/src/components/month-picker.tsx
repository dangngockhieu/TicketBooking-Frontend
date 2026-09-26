import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { formatMonthLabel, shiftMonthKey, type MonthKey } from "@ticketbooking/shared";

/** Chọn tháng: nút lùi/tiến — bản rút gọn của apps/web/src/components/common/month-picker.tsx
 * (bỏ lưới 12 tháng theo năm, vì mobile ít không gian màn hình hơn). */
export function MonthPicker({
  value,
  onChange,
  max,
}: {
  value: MonthKey;
  onChange: (month: MonthKey) => void;
  max: MonthKey;
}) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        accessibilityLabel="Tháng trước"
        onPress={() => onChange(shiftMonthKey(value, -1))}
      >
        <ChevronLeft size={18} color="#1d1d1f" />
      </TouchableOpacity>

      <Text style={styles.label}>{formatMonthLabel(value)}</Text>

      <TouchableOpacity
        style={[styles.button, value >= max ? styles.buttonDisabled : null]}
        accessibilityLabel="Tháng sau"
        disabled={value >= max}
        onPress={() => onChange(shiftMonthKey(value, 1))}
      >
        <ChevronRight size={18} color={value >= max ? "#c7c7cc" : "#1d1d1f"} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    padding: 4,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.4 },
  label: { minWidth: 110, textAlign: "center", fontSize: 14, fontWeight: "600", color: "#1d1d1f" },
});
