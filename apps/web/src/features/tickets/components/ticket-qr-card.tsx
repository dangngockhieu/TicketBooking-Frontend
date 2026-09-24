import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/status-badge";
import type { Ticket } from "@ticketbooking/shared";

/** QR chỉ hiển thị khi ISSUED; CHECKED_IN → QR mờ + giờ đã dùng. Xem docs/06 §5. */
export function TicketQrCard({
  ticket,
  checkedInAt,
}: {
  ticket: Ticket;
  checkedInAt: string | null;
}) {
  const used = ticket.status === "CHECKED_IN";

  return (
    <Card className="flex flex-col items-center gap-3 p-6 text-center">
      <p className="font-medium text-ink">{ticket.ticketClassName}</p>
      <StatusBadge status={ticket.status} />
      <div className={used ? "opacity-30 grayscale" : undefined}>
        <div className="rounded-md bg-white p-4">
          <QRCodeSVG value={ticket.qrCodeData} size={240} />
        </div>
      </div>
      {used && checkedInAt ? (
        <p className="text-sm text-ink-muted-48">Đã sử dụng lúc {checkedInAt}</p>
      ) : null}
      <p className="font-mono text-xs text-ink-muted-48">
        Mã: {ticket.id.slice(0, 8).toUpperCase()}
      </p>
    </Card>
  );
}
