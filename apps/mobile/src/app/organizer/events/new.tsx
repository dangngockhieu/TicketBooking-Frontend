import { router } from "expo-router";
import { EventForm } from "@/features/organizer/components/event-form";
import { useCreateEvent, usePublishEvent } from "@/features/organizer/hooks";

export default function CreateEventScreen() {
  const createEvent = useCreateEvent();
  const publishEvent = usePublishEvent();

  return (
    <EventForm
      onSave={(body) => createEvent.mutateAsync(body)}
      onPublish={(eventId) => publishEvent.mutateAsync(eventId).then(() => undefined)}
      onDone={(savedEventId, published) => {
        if (published) {
          router.replace("/organizer/events" as never);
        } else {
          router.replace({
            pathname: "/organizer/events/[eventId]/edit",
            params: { eventId: savedEventId },
          } as never);
        }
      }}
      isSaving={createEvent.isPending}
      isPublishing={publishEvent.isPending}
    />
  );
}
