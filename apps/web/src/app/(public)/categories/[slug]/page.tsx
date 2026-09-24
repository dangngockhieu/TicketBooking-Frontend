import { notFound } from "next/navigation";
import { serverFetch } from "@/lib/server-fetch";
import { EventGrid } from "@/features/events/components/event-grid";
import { Pagination } from "@/components/common/pagination";
import type { Category, EventSummary, PageResponse } from "@ticketbooking/shared";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const categories = await serverFetch<Category[]>("/api/categories", { revalidate: 300 });
  const category = categories.find((c) => c.slug === slug);
  return { title: category?.name ?? "Danh mục" };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Number(sp.page ?? "1");

  const categories = await serverFetch<Category[]>("/api/categories", { revalidate: 300 });
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const events = await serverFetch<PageResponse<EventSummary>>(
    `/api/events?category=${slug}&page=${page}&size=20`,
    { revalidate: 30 },
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold text-ink">{category.name}</h1>
      <EventGrid events={events.items} />
      <Pagination
        page={page}
        totalPages={events.totalPages}
        basePath={`/categories/${slug}`}
        searchParams={sp}
      />
    </div>
  );
}
