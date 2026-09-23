import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/common/money";
import { DateTime } from "@/components/common/date-time";
import type { EventSummary } from "@/types/api";

export function EventCard({ event }: { event: EventSummary }) {
  return (
    <Link href={`/events/${event.id}`} className="group block">
      <Card className="overflow-hidden transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <div className="relative aspect-video w-full overflow-hidden bg-canvas-parchment">
          {event.bannerUrl ? (
            <Image
              src={event.bannerUrl}
              alt={event.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
              className="object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-ink-muted-48">
              Chưa có ảnh
            </div>
          )}
          {event.saleState === "SOLD_OUT" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white">
              Hết vé
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5 p-4">
          <span className="text-xs font-medium text-primary">{event.category.name}</span>
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-ink">
            {event.title}
          </h3>
          <DateTime iso={event.startTime} variant="date" className="text-sm text-ink-muted-48" />
          <p className="flex items-center gap-1 text-sm text-ink-muted-48">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{event.location}</span>
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            Từ <Money amount={event.minPrice} />
          </p>
        </div>
      </Card>
    </Link>
  );
}
