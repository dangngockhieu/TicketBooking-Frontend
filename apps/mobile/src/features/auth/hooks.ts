import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useQueueStore } from "@/features/queue/store";
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResendVerificationRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from "@ticketbooking/shared";

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (body: LoginRequest) => authApi.login(body),
    onSuccess: (res) => setSession(res),
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

export function useForgotPassword() {
  return useMutation({
    mutationFn: (body: ForgotPasswordRequest) => authApi.forgotPassword(body),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (body: ResetPasswordRequest) => authApi.resetPassword(body),
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

/** Không có BroadcastChannel/nhiều tab như web — chỉ 1 instance app đang chạy. */
export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const clearQueueTokens = useQueueStore((s) => s.clearAll);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clear();
      queryClient.clear();
      clearQueueTokens();
      router.replace("/");
    },
  });
}
