import { Card } from "@/components/ui/card";
import { formatVnd } from "@/lib/format";
import type { EventReport } from "@/types/api";

export function KpiTiles({ summary }: { summary: EventReport["summary"] }) {
  const tiles = [
    { label: "Doanh thu", value: formatVnd(summary.totalRevenue) },
    { label: "Vé đã bán", value: `${summary.totalTicketsSold}` },
    { label: "Đã check-in", value: `${summary.totalTicketsCheckedIn}` },
    { label: "Tỷ lệ check-in", value: `${Math.round(summary.checkInRate * 100)}%` },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {tiles.map((tile) => (
        <Card key={tile.label} className="p-4">
          <p className="text-sm text-ink-muted-48">{tile.label}</p>
          <p className="mt-1 text-xl font-semibold text-ink">{tile.value}</p>
        </Card>
      ))}
    </div>
  );
}
