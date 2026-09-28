import { env } from "@/lib/env";
import { ApiError, type ApiResponse, type EventDetail } from "@ticketbooking/shared";
import { normalizeEvent } from "@/lib/api";

/**
 * Fetch dùng trong Server Component cho dữ liệu public (không cần access token,
 * vì server không có token của người dùng — xem docs/02-architecture.md ADR-03).
 * Hỗ trợ ISR qua `next: { revalidate }`.
 */
export async function serverFetch<T>(
  path: string,
  opts?: { revalidate?: number; fallback?: T },
): Promise<T> {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
      next: { revalidate: opts?.revalidate ?? 60 },
    });
    const body = (await res.json().catch(() => null)) as ApiResponse<unknown> | null;

    // Backend trả ApiResponse envelope: status === 0 là thành công
    if (!res.ok || !body || body.status !== 0) {
      console.warn(
        `[serverFetch] ${path} → HTTP ${res.status}, body.status=${body?.status ?? "null"}`,
      );
      if (opts?.fallback !== undefined) return opts.fallback;
      return (
        returnSafeFallback<T>(path) ??
        (() => {
          throw new ApiError(res.status, body?.message ?? "Có lỗi xảy ra khi tải dữ liệu.");
        })()
      );
    }

    let data = body.data;
    if (data && typeof data === "object") {
      const rec = data as Record<string, unknown>;
      if (Array.isArray(rec.items)) {
        data = {
          ...rec,
          items: rec.items.map((it) => normalizeEvent(it as EventDetail)),
        };
      } else if (rec.ticketClasses) {
        data = normalizeEvent(rec as unknown as EventDetail);
      }
    }

    return data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (opts?.fallback !== undefined) return opts.fallback;

    console.warn(
      `[serverFetch] Backend offline tại ${env.NEXT_PUBLIC_API_URL}${path}. Sử dụng dữ liệu khởi tạo.`,
    );
    return (
      returnSafeFallback<T>(path) ??
      (() => {
        throw err;
      })()
    );
  }
}

const emptyPage = {
  items: [],
  page: 1,
  size: 20,
  totalElements: 0,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
};

/** Trả dữ liệu rỗng an toàn cho các path public đã biết, tránh crash khi backend offline / 401 */
function returnSafeFallback<T>(path: string): T | null {
  if (path.includes("/categories")) return [] as unknown as T;
  if (path.includes("/events")) return emptyPage as unknown as T;
  return null;
}
