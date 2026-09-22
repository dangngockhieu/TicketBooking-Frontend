import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { PayoutRequestStatus } from "@/types/api";

const MAP: Record<PayoutRequestStatus, { label: string; variant: BadgeProps["variant"] }> = {
  PENDING: { label: "Chờ duyệt", variant: "warning" },
  APPROVED: { label: "Đã duyệt, chờ chuyển khoản", variant: "info" },
  REJECTED: { label: "Đã từ chối", variant: "danger" },
  PAID: { label: "Đã chi trả", variant: "success" },
  HOLD: { label: "Đang tạm giữ", variant: "danger" },
};

export function PayoutStatusBadge({ status }: { status: PayoutRequestStatus }) {
  const entry = MAP[status];
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}
