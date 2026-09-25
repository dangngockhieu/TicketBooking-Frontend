import { StyleSheet, Text, View } from "react-native";
import type {
  AccountStatus,
  BookingStatus,
  EventStatus,
  TicketStatus,
} from "@ticketbooking/shared";

type Variant = "warning" | "success" | "muted" | "info" | "danger";

/** Mapping trạng thái → nhãn/màu theo docs/01-use-cases.md §5 — giữ đồng bộ với
 * apps/web/src/components/common/status-badge.tsx. */
const MAP: Record<string, { label: string; variant: Variant }> = {
  PENDING_PAYMENT: { label: "Chờ thanh toán", variant: "warning" },
  PAID: { label: "Đã thanh toán", variant: "success" },
  CANCELLED: { label: "Đã hủy", variant: "muted" },
  REFUNDED: { label: "Đã hoàn tiền", variant: "info" },
  ISSUED: { label: "Hợp lệ", variant: "success" },
  CHECKED_IN: { label: "Đã check-in", variant: "info" },
  LOCKED_TICKET: { label: "Đang giữ", variant: "muted" },
  DRAFT: { label: "Nháp", variant: "muted" },
  PUBLISHED: { label: "Đang bán", variant: "success" },
  COMPLETED: { label: "Đã diễn ra", variant: "muted" },
  PENDING: { label: "Chờ xác thực", variant: "warning" },
  ACTIVE: { label: "Hoạt động", variant: "success" },
  LOCKED: { label: "Đã khóa", variant: "danger" },
};

const VARIANT_COLORS: Record<Variant, { bg: string; fg: string }> = {
  warning: { bg: "#fef3c7", fg: "#92400e" },
  success: { bg: "#d1fae5", fg: "#065f46" },
  muted: { bg: "#f2f2f7", fg: "#6b6b70" },
  info: { bg: "#dbeafe", fg: "#1e40af" },
  danger: { bg: "#fde2e2", fg: "#b42318" },
};

export function StatusBadge({
  status,
}: {
  status: BookingStatus | TicketStatus | EventStatus | AccountStatus;
}) {
  const entry = MAP[status] ?? { label: status, variant: "muted" as const };
  const colors = VARIANT_COLORS[entry.variant];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.label, { color: colors.fg }]}>{entry.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: { fontSize: 12, fontWeight: "600" },
});
