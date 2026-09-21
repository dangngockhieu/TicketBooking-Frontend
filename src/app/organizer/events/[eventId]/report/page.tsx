"use client";

import { use } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/error-state";
import { KpiTiles } from "@/features/organizer/components/kpi-tiles";
import { ReportCharts } from "@/features/organizer/components/report-charts";
import { useEventReport } from "@/features/organizer/hooks";

export default function EventReportPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { data: report, isLoading, isError, refetch } = useEventReport(eventId);

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (isError || !report) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Báo cáo doanh thu" description={report.eventTitle} />
      <KpiTiles summary={report.summary} />
      <ReportCharts report={report} />
    </div>
  );
}
