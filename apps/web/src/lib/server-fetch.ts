import { env } from "@/lib/env";
import { ApiError, type ApiResponse } from "@ticketbooking/shared";

/**
 * Fetch dùng trong Server Component cho dữ liệu public (không cần access token,
 * vì server không có token của người dùng — xem docs/02-architecture.md ADR-03).
 * Hỗ trợ ISR qua `next: { revalidate }`.
 */
export async function serverFetch<T>(path: string, opts?: { revalidate?: number }): Promise<T> {
  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
    next: { revalidate: opts?.revalidate ?? 60 },
  });
  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!res.ok || !body) {
    throw new ApiError(res.status, body?.message ?? "Có lỗi xảy ra khi tải dữ liệu.");
  }
  return body.data as T;
}
