import { StyleSheet, Text, View } from "react-native";
import type { PayoutRequestStatus } from "@ticketbooking/shared";

type Variant = "warning" | "success" | "info" | "danger";

const MAP: Record<PayoutRequestStatus, { label: string; variant: Variant }> = {
  PENDING: { label: "Chờ duyệt", variant: "warning" },
  APPROVED: { label: "Đã duyệt, chờ chuyển khoản", variant: "info" },
  REJECTED: { label: "Đã từ chối", variant: "danger" },
  PAID: { label: "Đã chi trả", variant: "success" },
  HOLD: { label: "Đang tạm giữ", variant: "danger" },
};

const VARIANT_COLORS: Record<Variant, { bg: string; fg: string }> = {
  warning: { bg: "#fef3c7", fg: "#92400e" },
  success: { bg: "#d1fae5", fg: "#065f46" },
  info: { bg: "#dbeafe", fg: "#1e40af" },
  danger: { bg: "#fde2e2", fg: "#b42318" },
};

export function PayoutStatusBadge({ status }: { status: PayoutRequestStatus }) {
  const entry = MAP[status];
  const colors = VARIANT_COLORS[entry.variant];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.label, { color: colors.fg }]}>{entry.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  label: { fontSize: 12, fontWeight: "600" },
});
