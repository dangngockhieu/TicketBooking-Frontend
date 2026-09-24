import { useEffect } from "react";
import { ApiError } from "@ticketbooking/shared";
import { authApi } from "@/lib/api";
import { getStoredRefreshToken, useAuthStore } from "@/lib/store";

/**
 * Bootstrap phiên đăng nhập khi app khởi động — đọc refreshToken đã lưu trong
 * SecureStore rồi gọi /api/auth/refresh. Khác web (dựa vào cookie tự gửi kèm):
 * mobile phải tự đọc và truyền refreshToken; không có gì để refresh thì coi như
 * chưa đăng nhập, không phải lỗi. Xem docs/04-auth-flow.md §3.1.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setStatus = useAuthStore((s) => s.setStatus);
  const setSession = useAuthStore((s) => s.setSession);
  const clear = useAuthStore((s) => s.clear);
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status !== "idle") return;
    setStatus("loading");
    getStoredRefreshToken()
      .then((refreshToken) => {
        if (!refreshToken) {
          clear();
          return;
        }
        return authApi.refresh(refreshToken).then((res) => setSession(res));
      })
      .catch((err) => {
        if (!(err instanceof ApiError)) console.error(err);
        clear();
      });
  }, [status, setStatus, setSession, clear]);

  return children;
}
