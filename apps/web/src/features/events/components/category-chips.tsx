import Link from "next/link";
import type { Category } from "@ticketbooking/shared";

export function CategoryChips({ categories }: { categories: Category[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/categories/${category.slug}`}
          className="rounded-pill border border-hairline bg-canvas px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-primary hover:text-primary"
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
