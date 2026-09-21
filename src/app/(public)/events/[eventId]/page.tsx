import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { serverFetch } from "@/lib/server-fetch";
import { DateTime } from "@/components/common/date-time";
import { TicketSelector } from "@/features/booking/components/ticket-selector";
import { ApiError, type EventDetail } from "@/types/api";

export const revalidate = 60;

interface Props {
  params: Promise<{ eventId: string }>;
}

async function getEvent(eventId: string): Promise<EventDetail | null> {
  try {
    return await serverFetch<EventDetail>(`/api/events/${eventId}`);
  } catch (err) {
    if (err instanceof ApiError && err.httpStatus === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: Props) {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  if (!event) return { title: "Không tìm thấy sự kiện" };
  return {
    title: event.title,
    description: event.description ?? undefined,
    openGraph: {
      title: event.title,
      images: event.bannerUrl ? [event.bannerUrl] : undefined,
    },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  if (!event) notFound();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-canvas-parchment">
        {event.bannerUrl ? (
          <Image src={event.bannerUrl} alt={event.title} fill priority className="object-cover" />
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <div>
            <span className="text-sm font-medium text-primary">{event.category.name}</span>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{event.title}</h1>
            <div className="mt-3 flex flex-col gap-1 text-sm text-ink-muted-48 sm:flex-row sm:gap-6">
              <span>📅 <DateTime iso={event.startTime} /></span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" aria-hidden />
                {event.venueName ? `${event.venueName}, ` : ""}
                {event.location}
              </span>
            </div>
          </div>

          {event.description ? (
            <section className="prose max-w-none text-ink">
              <h2 className="text-lg font-semibold text-ink">Giới thiệu</h2>
              <p className="whitespace-pre-line text-ink-muted-80">{event.description}</p>
            </section>
          ) : null}
        </div>

        <TicketSelector event={event} />
      </div>
    </div>
  );
}
