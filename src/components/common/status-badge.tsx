import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { AccountStatus, BookingStatus, EventStatus, TicketStatus } from "@/types/api";

/** Mapping trạng thái → nhãn/màu theo docs/01-use-cases.md §5. */
const MAP: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
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

export function StatusBadge({
  status,
}: {
  status: BookingStatus | TicketStatus | EventStatus | AccountStatus;
}) {
  const entry = MAP[status] ?? { label: status, variant: "muted" as const };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}
