import Link from "next/link";
import { cn } from "@/lib/utils";

/** Phân trang đồng bộ URL — nhận sẵn base search params, chỉ đổi `page`. */
export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Phân trang" className="flex items-center justify-center gap-1">
      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium",
            p === page ? "bg-primary text-on-primary" : "text-ink hover:bg-canvas-parchment",
          )}
        >
          {p}
        </Link>
      ))}
    </nav>
  );
}
