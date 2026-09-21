import { Suspense } from "react";
import { serverFetch } from "@/lib/server-fetch";
import { EventFilters } from "@/features/events/components/event-filters";
import { EventGrid } from "@/features/events/components/event-grid";
import { Pagination } from "@/components/common/pagination";
import type { Category, EventSummary, PageResponse } from "@/types/api";

export const metadata = { title: "Tìm sự kiện" };

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function EventsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");

  const query = new URLSearchParams();
  if (params.keyword) query.set("keyword", params.keyword);
  if (params.location) query.set("location", params.location);
  if (params.category) query.set("category", params.category);
  query.set("page", String(page));
  query.set("size", "20");

  const [categories, events] = await Promise.all([
    serverFetch<Category[]>("/api/categories", { revalidate: 300 }),
    serverFetch<PageResponse<EventSummary>>(`/api/events?${query.toString()}`, { revalidate: 30 }),
  ]);

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[240px_1fr]">
      <aside className="rounded-lg border border-hairline bg-canvas p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted-48">Bộ lọc</h2>
        <Suspense>
          <EventFilters categories={categories} />
        </Suspense>
      </aside>

      <section className="flex flex-col gap-6">
        <p className="text-sm text-ink-muted-48">{events.totalElements} sự kiện</p>
        <EventGrid events={events.items} />
        <Pagination page={page} totalPages={events.totalPages} basePath="/events" searchParams={params} />
      </section>
    </div>
  );
}
