import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

/** UC-A3: giám sát hệ thống — chỉ link ra công cụ ngoài (Grafana/Kafka UI), không có chức năng riêng. */
const MONITORING_LINKS = [
  { label: "Grafana", url: "http://localhost:3001", description: "Dashboard giám sát hệ thống" },
  { label: "Kafka UI", url: "http://localhost:8085", description: "Theo dõi topic & consumer group" },
];

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Tổng quan hệ thống" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MONITORING_LINKS.map((link) => (
          <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">
            <Card className="transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <CardTitle>{link.label}</CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </div>
                <ExternalLink className="h-5 w-5 text-ink-muted-48" aria-hidden />
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
