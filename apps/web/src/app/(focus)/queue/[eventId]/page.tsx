"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { queueApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { useQueueStore } from "@/features/queue/store";
import { useQueue } from "@/features/queue/use-queue";
import { QueuePosition } from "@/features/queue/components/queue-position";
import { ConnectionIndicator } from "@/features/queue/components/connection-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function QueuePage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const router = useRouter();
  const existingToken = useQueueStore((s) => s.get(eventId));

  const { data: status, isLoading } = useQuery({
    queryKey: qk.queueStatus(eventId),
    queryFn: () => queueApi.getStatus(eventId),
    enabled: !existingToken,
  });

  const skipQueue = !!existingToken || (status && !status.queueEnabled);

  useEffect(() => {
    if (skipQueue) router.replace(`/events/${eventId}`);
  }, [skipQueue, eventId, router]);

  const { state, otherTabWaiting, leave, retry } = useQueue(skipQueue ? "" : eventId);

  if (isLoading && !existingToken) return <Skeleton className="mx-auto mt-20 h-40 max-w-md" />;
  if (skipQueue) return null;

  if (otherTabWaiting) {
    return (
      <Center title="Bạn đang chờ ở tab khác" description="Vui lòng quay lại tab đó để tiếp tục." />
    );
  }

  if (state.status === "admitted") {
    router.replace(`/events/${eventId}`);
    return <Center title="Đến lượt bạn!" description="Đang chuyển hướng…" />;
  }

  if (state.status === "lost") {
    return (
      <Center
        title="Bạn đã rời khỏi hàng chờ"
        description="Kết nối bị gián đoạn quá lâu."
        action={<Button onClick={retry}>Vào lại hàng chờ</Button>}
      />
    );
  }

  if (state.status === "checking" || state.status === "connecting") {
    return <Center title="Đang kết nối tới phòng chờ…" />;
  }

  const waitingData = state.status === "waiting" ? state : state.lastKnown;
  const connectionState = state.status === "waiting" ? "connected" : "reconnecting";

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-ink">Đang xếp hàng chờ</h1>

      {waitingData ? (
        <QueuePosition
          position={waitingData.position}
          totalWaiting={waitingData.totalWaiting}
          estimatedWaitSeconds={waitingData.estimatedWaitSeconds}
          initialPosition={waitingData.initialPosition}
        />
      ) : (
        <Skeleton className="h-32 w-full" />
      )}

      <p className="text-sm text-ink-muted-48" role="status">
        Không đóng tab hoặc tải lại trang — bạn sẽ mất chỗ.
      </p>

      <ConnectionIndicator state={connectionState} />

      <Button variant="secondary" onClick={leave}>
        Rời hàng chờ
      </Button>
    </div>
  );
}

function Center({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <h1 className="text-xl font-semibold text-ink">{title}</h1>
      {description ? <p className="text-sm text-ink-muted-48">{description}</p> : null}
      {action}
    </div>
  );
}
