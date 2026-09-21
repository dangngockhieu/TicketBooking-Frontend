import Link from "next/link";
import { serverFetch } from "@/lib/server-fetch";
import { CategoryChips } from "@/features/events/components/category-chips";
import { EventGrid } from "@/features/events/components/event-grid";
import { Button } from "@/components/ui/button";
import type { Category, EventSummary, PageResponse } from "@/types/api";

export const revalidate = 60;

export default async function HomePage() {
  const [categories, events] = await Promise.all([
    serverFetch<Category[]>("/api/categories", { revalidate: 300 }),
    serverFetch<PageResponse<EventSummary>>("/api/events?size=8&sort=startTime,asc"),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8">
      <section className="rounded-lg bg-ink px-8 py-16 text-center text-body-on-dark sm:py-24">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          Vé sự kiện bạn yêu thích, chỉ một chạm
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-body-muted">
          Concert, hội thảo, thể thao và nhiều hơn nữa — tìm kiếm, giữ chỗ, thanh toán an toàn.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-ink">Danh mục</h2>
        <CategoryChips categories={categories} />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Sắp diễn ra</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/events">Xem tất cả</Link>
          </Button>
        </div>
        <EventGrid events={events.items} />
      </section>
    </div>
  );
}
