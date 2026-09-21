"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/features/auth/store";
import type {
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResendVerificationRequest,
  VerifyEmailRequest,
} from "@/types/api";

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (body: LoginRequest) => authApi.login(body),
    onSuccess: (res) => {
      setSession(res);
      new BroadcastChannel("auth").postMessage("login");
    },
  });
}

export function useRegister() {
  return useMutation({ mutationFn: (body: RegisterRequest) => authApi.register(body) });
}

export function useVerifyEmail() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (body: VerifyEmailRequest) => authApi.verifyEmail(body),
    onSuccess: (res) => setSession(res),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (body: ResendVerificationRequest) => authApi.resendVerification(body),
  });
}

export function useChangePassword() {
  const clear = useAuthStore((s) => s.clear);
  return useMutation({
    mutationFn: (body: ChangePasswordRequest) => authApi.changePassword(body),
    onSuccess: () => {
      // Server đã thu hồi toàn bộ refresh token — buộc đăng nhập lại. Xem docs/04-auth-flow.md §3.3c.
      clear();
    },
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clear();
      queryClient.clear();
      new BroadcastChannel("auth").postMessage("logout");
    },
  });
}
