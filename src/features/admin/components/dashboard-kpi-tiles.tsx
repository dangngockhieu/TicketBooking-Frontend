import { Card } from "@/components/ui/card";
import { Money } from "@/components/common/money";
import type { AdminDashboardStats } from "@/types/api";

export function DashboardKpiTiles({ summary }: { summary: AdminDashboardStats["summary"] }) {
  const tiles = [
    { label: "Tổng doanh thu", value: <Money amount={summary.totalRevenue} /> },
    { label: "Phí nền tảng thu về", value: <Money amount={summary.totalPlatformFee} /> },
    { label: "Vé đã bán", value: summary.totalTicketsSold.toLocaleString("vi-VN") },
    { label: "Sự kiện diễn ra", value: summary.eventsHeld.toLocaleString("vi-VN") },
    { label: "Organizer mới", value: summary.newOrganizers.toLocaleString("vi-VN") },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((tile) => (
        <Card key={tile.label} className="p-4">
          <p className="text-sm text-ink-muted-48">{tile.label}</p>
          <p className="mt-1 text-xl font-semibold text-ink">{tile.value}</p>
        </Card>
      ))}
    </div>
  );
}
