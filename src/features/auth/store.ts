import { create } from "zustand";
import type { AuthResponse, UserInfo } from "@/types/api";
import { serverTime } from "@/lib/server-time";

export type AuthStatus = "idle" | "loading" | "authenticated" | "anonymous";

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
 * Access token & user CHỈ sống trong memory (không persist) — bảo mật, xem
 * docs/02-architecture.md ADR-02. F5 → AuthProvider gọi lại /api/auth/refresh.
 */
export const useAuthStore = create<AuthState>((set) => ({
  status: "idle",
  accessToken: null,
  expiresAt: null,
  user: null,
  requirePasswordChange: false,
  setStatus: (status) => set({ status }),
  setSession: (res) =>
    set({
      status: "authenticated",
      accessToken: res.accessToken,
      expiresAt: serverTime.now() + res.expiresIn * 1000,
      user: res.user,
      requirePasswordChange: res.requirePasswordChange,
    }),
  clear: () =>
    set({
      status: "anonymous",
      accessToken: null,
      expiresAt: null,
      user: null,
      requirePasswordChange: false,
    }),
}));

/** Đọc snapshot token ngoài React (dùng trong http-client). */
export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
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
