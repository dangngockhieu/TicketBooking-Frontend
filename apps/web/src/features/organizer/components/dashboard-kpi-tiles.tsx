import { Card } from "@/components/ui/card";
import { Money } from "@/components/common/money";
import type { OrganizerDashboardStats } from "@/types/api";

export function OrganizerDashboardKpiTiles({
  summary,
}: {
  summary: OrganizerDashboardStats["summary"];
}) {
  const tiles = [
    { label: "Doanh thu ròng", value: <Money amount={summary.netRevenue} /> },
    { label: "Doanh thu gộp", value: <Money amount={summary.grossRevenue} /> },
    { label: "Phí nền tảng", value: <Money amount={summary.platformFee} /> },
    { label: "Vé đã bán", value: summary.totalTicketsSold.toLocaleString("vi-VN") },
    { label: "Sự kiện đã diễn ra", value: summary.eventsHeld.toLocaleString("vi-VN") },
    { label: "Sự kiện sắp diễn ra", value: summary.upcomingEvents.toLocaleString("vi-VN") },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {tiles.map((tile) => (
        <Card key={tile.label} className="p-4">
          <p className="text-sm text-ink-muted-48">{tile.label}</p>
          <p className="mt-1 text-xl font-semibold text-ink">{tile.value}</p>
        </Card>
      ))}
    </div>
  );
}
