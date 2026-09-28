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
    if (!res.ok || !body) {
      if (opts?.fallback !== undefined) return opts.fallback;
      throw new ApiError(res.status, body?.message ?? "Có lỗi xảy ra khi tải dữ liệu.");
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
    if (opts?.fallback !== undefined) return opts.fallback;
    // Khi next build prerender trang tĩnh mà backend chưa bật, fallback an toàn để build không bị đứt
    const isConnError =
      err instanceof TypeError ||
      (err as { code?: string })?.code === "ECONNREFUSED" ||
      String(err).includes("fetch failed");

    if (isConnError) {
      console.warn(
        `[serverFetch] Backend offline tại ${env.NEXT_PUBLIC_API_URL}${path}. Sử dụng dữ liệu khởi tạo.`,
      );
      if (path.includes("/categories")) return [] as unknown as T;
      if (path.includes("/events")) {
        return {
          items: [],
          page: 1,
          size: 20,
          totalElements: 0,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        } as unknown as T;
      }
    }
    throw err;
  }
}
