"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { queueApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

/**
 * Bản tối giản: hiện trạng thái phòng chờ tĩnh. Client STOMP đầy đủ (state machine,
 * reconnect, đa tab) thuộc phạm vi UC-C4 — xem docs/07-waiting-room.md — chưa triển khai.
 */
export default function QueuePage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const router = useRouter();
  const { data: status, isLoading } = useQuery({
    queryKey: qk.queueStatus(eventId),
    queryFn: () => queueApi.getStatus(eventId),
  });

  useEffect(() => {
    if (status && !status.queueEnabled) {
      router.replace(`/events/${eventId}`);
    }
  }, [status, eventId, router]);

  if (isLoading) return <Skeleton className="mx-auto mt-20 h-40 max-w-md" />;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <h1 className="text-xl font-semibold text-ink">Đang chờ tới lượt bạn</h1>
      <p className="text-sm text-ink-muted-48">
        Tổng số người đang chờ: {status?.totalWaiting ?? "—"} · Ước tính:{" "}
        {status ? Math.ceil(status.estimatedWaitTimeSeconds / 60) : "—"} phút
      </p>
      <Button variant="secondary" onClick={() => router.push(`/events/${eventId}`)}>
        Rời hàng chờ
      </Button>
    </div>
  );
}
