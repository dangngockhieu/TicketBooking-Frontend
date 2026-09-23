import { env } from "@/lib/env";
import { serverTime } from "@/lib/server-time";
import { getAccessToken, useAuthStore } from "@/features/auth/store";
import { ApiError, type ApiResponse } from "@/types/api";

/**
 * Lớp gọi API THẬT — chỉ được dùng bởi src/lib/api.ts.
 * Không import trực tiếp từ feature/UI. Xem docs/02-architecture.md §4.
 */

let refreshInflight: Promise<boolean> | null = null;

async function refreshOnce(): Promise<boolean> {
  if (!refreshInflight) {
    refreshInflight = doRefresh().finally(() => {
      refreshInflight = null;
    });
  }
  return refreshInflight;
}

async function doRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "X-Client-Type": "WEB" },
    });
    if (!res.ok) return false;
    const body = (await res.json()) as ApiResponse<import("@/types/api").AuthResponse>;
    if (!body.data) return false;
    serverTime.sync(body.responseTime);
    useAuthStore.getState().setSession(body.data);
    return true;
  } catch {
    return false;
  }
}

interface HttpOptions extends RequestInit {
  /** false = không tự động thử refresh khi 401 (dùng cho chính request login/refresh). */
  auth?: boolean;
}

export async function http<T>(path: string, init?: HttpOptions): Promise<T> {
  const { auth = true, headers, ...rest } = init ?? {};
  const token = getAccessToken();

  const doFetch = () =>
    fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
      ...rest,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Type": "WEB",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });

  let res = await doFetch();

  if (res.status === 401 && auth && token) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      res = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
        ...rest,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Client-Type": "WEB",
          Authorization: `Bearer ${getAccessToken()}`,
          ...headers,
        },
      });
    } else {
      useAuthStore.getState().clear();
      throw new ApiError(401, "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
    }
  }

  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (body?.responseTime) serverTime.sync(body.responseTime);

  if (!res.ok || !body) {
    throw new ApiError(res.status, body?.message ?? "Có lỗi xảy ra.", body?.errors);
  }

  return body.data as T;
}
