"use client";

import { PageHeader } from "@/components/common/page-header";
import { EventForm } from "@/features/organizer/components/event-form";
import { useCreateEvent, usePublishEvent } from "@/features/organizer/hooks";

export default function NewEventPage() {
  const createEvent = useCreateEvent();
  const publishEvent = usePublishEvent();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Tạo sự kiện" />
      <EventForm
        onSave={(body) => createEvent.mutateAsync(body)}
        onPublish={(eventId) => publishEvent.mutateAsync(eventId).then(() => undefined)}
        isSaving={createEvent.isPending}
        isPublishing={publishEvent.isPending}
      />
    </div>
  );
}
