import { create } from "zustand";
import type { AuthResponse, UserInfo } from "@ticketbooking/shared";
import { serverTime } from "@/lib/server-time";

export type AuthStatus = "idle" | "loading" | "authenticated" | "anonymous";

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  expiresAt: number | null; // epoch ms
  user: UserInfo | null;
  requirePasswordChange: boolean;
  /** true khi người dùng chủ động đăng xuất — RoleGuard về "/" thay vì /login?next=... */
  loggedOut: boolean;
  setStatus(status: AuthStatus): void;
  setSession(res: AuthResponse): void;
  clear(opts?: { loggedOut?: boolean }): void;
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
  loggedOut: false,
  setStatus: (status) => set({ status }),
  setSession: (res) =>
    set({
      status: "authenticated",
      accessToken: res.accessToken,
      expiresAt: serverTime.now() + res.expiresIn * 1000,
      user: res.user,
      requirePasswordChange: res.requirePasswordChange ?? false,
      loggedOut: false,
    }),
  clear: (opts) =>
    set({
      status: "anonymous",
      accessToken: null,
      expiresAt: null,
      user: null,
      requirePasswordChange: false,
      loggedOut: opts?.loggedOut ?? false,
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

/** Prefix route → role được vào; khớp với RoleGuard trong các layout. Path khác là public. */
const ROUTE_ROLES: [prefix: string, roles: UserInfo["role"][]][] = [
  ["/admin", ["ADMIN"]],
  ["/organizer", ["ORGANIZER"]],
  ["/me/profile", ["CUSTOMER", "ORGANIZER", "ADMIN"]],
  ["/me/security", ["CUSTOMER", "ORGANIZER", "ADMIN"]],
  ["/me", ["CUSTOMER"]],
  ["/checkout", ["CUSTOMER"]],
  ["/payment", ["CUSTOMER"]],
  ["/queue", ["CUSTOMER"]],
];

/** Role có được vào path này không — dùng để bỏ qua ?next= không hợp lệ sau khi login. */
export function canAccess(role: UserInfo["role"], path: string): boolean {
  const pathname = path.split(/[?#]/)[0] ?? path;
  const rule = ROUTE_ROLES.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return rule ? rule[1].includes(role) : true;
}
