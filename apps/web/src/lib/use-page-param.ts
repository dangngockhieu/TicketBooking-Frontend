"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * Đọc/ghi `page` (và các filter khác) qua URL searchParams — share link được,
 * back/forward đúng. Dùng cho các bảng danh sách Organizer/Admin (Client Component,
 * không phải Server Component như /events nên không dùng router.push + Suspense
 * boundary theo cùng cách, nhưng nguyên tắc giống nhau).
 */
export function usePageParam() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1") || 1;

  const setPage = useCallback(
    (next: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next <= 1) params.delete("page");
      else params.set("page", String(next));
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  /** Đổi 1 filter khác (status/keyword) và luôn reset page về 1. `value` rỗng/undefined xóa key đó. */
  const setFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  return { page, setPage, setFilter, searchParams };
}
