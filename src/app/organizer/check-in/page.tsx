"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { CheckInScanner } from "@/features/organizer/components/check-in-scanner";
import { useOrganizerEvents } from "@/features/organizer/hooks";

export default function CheckInPage() {
  const { data, isLoading } = useOrganizerEvents({ status: "PUBLISHED", size: 50 });
  const [eventId, setEventId] = useState<string>("");

  const events = data?.items ?? [];
  const selected = eventId || events[0]?.id || "";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Check-in" />

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : events.length === 0 ? (
        <EmptyState title="Không có sự kiện đang bán để check-in" />
      ) : (
        <div className="flex max-w-lg flex-col gap-4">
          <select
            value={selected}
            onChange={(e) => setEventId(e.target.value)}
            className="h-11 rounded-md border border-hairline bg-canvas px-3 text-[15px] text-ink outline-none focus-visible:border-primary"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>

          {selected ? <CheckInScanner key={selected} eventId={selected} /> : null}
        </div>
      )}
    </div>
  );
}
