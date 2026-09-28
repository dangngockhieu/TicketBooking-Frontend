import { ApiError, type ApiResponse } from "@ticketbooking/shared";
import { env } from "@/lib/env";
import { serverTime } from "@/lib/server-time";
import { getAccessToken, getStoredRefreshToken, useAuthStore } from "@/lib/store";

/**
 * Lớp gọi API THẬT — chỉ được dùng bởi src/lib/api.ts. Không import trực tiếp từ
 * màn hình/component. Khác apps/web/src/lib/http-client.ts: không có cookie HttpOnly
 * (không same-origin, không trình duyệt) — refreshToken tự lưu/gửi qua SecureStore
 * (xem ./store.ts) và body request, không phải Set-Cookie. Xem docs/04-auth-flow.md.
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
  const refreshToken = await getStoredRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${env.EXPO_PUBLIC_API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Client-Type": "MOBILE" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const body = (await res.json()) as ApiResponse<import("@ticketbooking/shared").AuthResponse>;
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
  const isFormData = typeof FormData !== "undefined" && rest.body instanceof FormData;

  const defaultHeaders: Record<string, string> = {
    "X-Client-Type": "MOBILE",
  };
  if (!isFormData) {
    defaultHeaders["Content-Type"] = "application/json";
  }
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const doFetch = () =>
    fetch(`${env.EXPO_PUBLIC_API_URL}${path}`, {
      ...rest,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
    });

  let res = await doFetch();

  if (res.status === 401 && auth && token) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      const retryHeaders: Record<string, string> = {
        "X-Client-Type": "MOBILE",
        Authorization: `Bearer ${getAccessToken()}`,
      };
      if (!isFormData) {
        retryHeaders["Content-Type"] = "application/json";
      }
      res = await fetch(`${env.EXPO_PUBLIC_API_URL}${path}`, {
        ...rest,
        headers: {
          ...retryHeaders,
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

  if (
    !res.ok ||
    !body ||
    (body.status !== undefined && body.status !== 0 && body.status !== res.status)
  ) {
    throw new ApiError(res.status, body?.message ?? "Có lỗi xảy ra.", body?.errors);
  }

  return body.data as T;
}
