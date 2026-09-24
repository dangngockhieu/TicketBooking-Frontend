import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { AuthResponse, UserInfo } from "@ticketbooking/shared";
import { serverTime } from "@/lib/server-time";

export type AuthStatus = "idle" | "loading" | "authenticated" | "anonymous";

const REFRESH_TOKEN_KEY = "ticketbooking.refreshToken";

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  expiresAt: number | null; // epoch ms
  user: UserInfo | null;
  requirePasswordChange: boolean;
  setStatus(status: AuthStatus): void;
  setSession(res: AuthResponse): void;
  clear(): void;
}

/**
 * Access token & user chỉ sống trong memory (không persist) — giống web. Khác web:
 * không có cookie HttpOnly nào lưu refreshToken hộ, nên app tự lưu nó vào SecureStore
 * (Keychain/Keystore, không phải AsyncStorage — refreshToken không được lưu ở dạng
 * plaintext trên đĩa). Xem docs/04-auth-flow.md — backend trả refreshToken trong body
 * khi request có header X-Client-Type: MOBILE.
 */
export const useAuthStore = create<AuthState>((set) => ({
  status: "idle",
  accessToken: null,
  expiresAt: null,
  user: null,
  requirePasswordChange: false,
  setStatus: (status) => set({ status }),
  setSession: (res) => {
    if (res.refreshToken) {
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, res.refreshToken).catch(() => {
        // Thiết bị không hỗ trợ SecureStore (hiếm) — phiên vẫn hoạt động trong session
        // này, chỉ mất khả năng tự đăng nhập lại sau khi tắt app.
      });
    }
    set({
      status: "authenticated",
      accessToken: res.accessToken,
      expiresAt: serverTime.now() + res.expiresIn * 1000,
      user: res.user,
      requirePasswordChange: res.requirePasswordChange,
    });
  },
  clear: () => {
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {});
    set({
      status: "anonymous",
      accessToken: null,
      expiresAt: null,
      user: null,
      requirePasswordChange: false,
    });
  },
}));

/** Đọc snapshot token ngoài React (dùng trong http-client). */
export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

/** Đọc refreshToken đã lưu — dùng lúc khởi động app để tự đăng nhập lại. */
export function getStoredRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY).catch(() => null);
}

export function homeOf(role: UserInfo["role"] | undefined): string {
  switch (role) {
    case "ORGANIZER":
      return "/organizer";
    case "ADMIN":
      return "/admin";
    default:
      return "/";
  }
}
