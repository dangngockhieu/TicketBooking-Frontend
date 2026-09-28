"use client";

import { useEffect } from "react";
import { authApi } from "@/lib/api";
import { ApiError, type AuthResponse } from "@ticketbooking/shared";
import { useAuthStore } from "@/features/auth/store";

/**
 * Single-flight cho refresh lúc bootstrap: StrictMode (dev) chạy effect 2 lần, mà backend
 * xoay vòng refresh token (RTR) — 2 request cùng cookie thì request sau fail và xoá phiên.
 */
let bootstrapInflight: Promise<AuthResponse> | null = null;
function refreshOnce(): Promise<AuthResponse> {
  bootstrapInflight ??= authApi.refresh().finally(() => {
    bootstrapInflight = null;
  });
  return bootstrapInflight;
}

/**
 * Bootstrap phiên đăng nhập khi app khởi động — gọi /api/auth/refresh dựa vào
 * cookie refreshToken (HttpOnly). Trang public vẫn render ngay, không chặn bởi
 * bootstrap; chỉ RoleGuard mới chờ status !== 'loading'. Xem docs/04-auth-flow.md §3.1.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setStatus = useAuthStore((s) => s.setStatus);
  const setSession = useAuthStore((s) => s.setSession);
  const clear = useAuthStore((s) => s.clear);
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status !== "idle") return;
    setStatus("loading");
    refreshOnce()
      .then((res) => setSession(res))
      .catch((err) => {
        if (!(err instanceof ApiError)) console.error(err);
        clear();
      });
  }, [status, setStatus, setSession, clear]);

  useEffect(() => {
    const channel = new BroadcastChannel("auth");
    channel.onmessage = (event) => {
      if (event.data === "logout") clear({ loggedOut: true });
      // Kênh cũng nhận message từ chính tab vừa login (instance BroadcastChannel khác trong
      // useLogin) — tab đó đã setSession rồi, refresh lại sẽ xoay vòng token vô ích.
      if (event.data === "login" && useAuthStore.getState().status !== "authenticated") {
        setStatus("idle");
      }
    };
    return () => channel.close();
  }, [clear, setStatus]);

  return children;
}
