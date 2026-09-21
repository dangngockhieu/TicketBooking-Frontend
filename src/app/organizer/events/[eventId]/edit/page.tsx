"use client";

import { use } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/error-state";
import { EventForm } from "@/features/organizer/components/event-form";
import { useOrganizerEvent, useUpdateEvent, usePublishEvent } from "@/features/organizer/hooks";

export default function EditEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { data: event, isLoading, isError, refetch } = useOrganizerEvent(eventId);
  const updateEvent = useUpdateEvent(eventId);
  const publishEvent = usePublishEvent();

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (isError || !event) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Sửa sự kiện" description={event.title} />
      <EventForm
        initialEvent={event}
        onSave={(body) => updateEvent.mutateAsync(body).then((res) => ({ id: res.id }))}
        onPublish={event.status === "DRAFT" ? (id) => publishEvent.mutateAsync(id).then(() => undefined) : undefined}
        isSaving={updateEvent.isPending}
        isPublishing={publishEvent.isPending}
      />
    </div>
  );
}
