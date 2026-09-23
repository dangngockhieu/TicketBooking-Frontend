"use client";

import { useEffect } from "react";
import { authApi } from "@/lib/api";
import { ApiError } from "@/types/api";
import { useAuthStore } from "@/features/auth/store";

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
    authApi
      .refresh()
      .then((res) => setSession(res))
      .catch((err) => {
        if (!(err instanceof ApiError)) console.error(err);
        clear();
      });
  }, [status, setStatus, setSession, clear]);

  useEffect(() => {
    const channel = new BroadcastChannel("auth");
    channel.onmessage = (event) => {
      if (event.data === "logout") clear();
      if (event.data === "login") setStatus("idle");
    };
    return () => channel.close();
  }, [clear, setStatus]);

  return children;
}
