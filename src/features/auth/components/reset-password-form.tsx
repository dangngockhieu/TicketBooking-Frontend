"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useForgotPassword, useResetPassword } from "@/features/auth/hooks";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/features/auth/schemas";
import { ApiError } from "@/types/api";
import { fallbackErrorMessage } from "@/lib/error-messages";

const RESEND_COOLDOWN_S = 60;

/** Bước 1: chỉ nhập email, gọi API gửi OTP. */
function RequestOtpStep({ onSent }: { onSent: (email: string) => void }) {
  const forgotPassword = useForgotPassword();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordInput) {
    setFormError(null);
    try {
      await forgotPassword.mutateAsync(values);
      onSent(values.email);
    } catch (err) {
      setFormError(fallbackErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <p className="text-center text-sm text-ink-muted-48">
        Nhập email đã đăng ký, chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
      </p>

      {formError ? (
        <div
          role="alert"
          className="rounded-md border border-hairline bg-canvas-parchment p-3 text-sm text-danger"
        >
          {formError}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email ? <p className="text-sm text-danger">{errors.email.message}</p> : null}
      </div>

      <Button type="submit" disabled={forgotPassword.isPending} className="mt-2">
        {forgotPassword.isPending ? "Đang gửi…" : "Gửi mã OTP"}
      </Button>

      <p className="text-center text-sm text-ink-muted-48">
        <Link href="/login" className="font-medium text-primary">
          Quay lại đăng nhập
        </Link>
      </p>
    </form>
  );
}

/** Bước 2: nhập OTP + mật khẩu mới, có thể gửi lại mã. */
function ConfirmResetStep({ email }: { email: string }) {
  const router = useRouter();
  const resetPassword = useResetPassword();
  const resend = useForgotPassword();
  const [cooldown, setCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordInput) {
    try {
      await resetPassword.mutateAsync({ email, ...values });
      toast.success("Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.");
      router.replace("/login");
    } catch (err) {
      if (err instanceof ApiError && (err.httpStatus === 400 || err.httpStatus === 404)) {
        setError("otp", { message: err.message });
        return;
      }
      toast.error(fallbackErrorMessage(err));
    }
  }

  async function handleResend() {
    try {
      await resend.mutateAsync({ email });
      toast.success("Đã gửi lại mã OTP");
      setCooldown(RESEND_COOLDOWN_S);
      const intervalId = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) clearInterval(intervalId);
          return Math.max(0, c - 1);
        });
      }, 1000);
    } catch (err) {
      toast.error(fallbackErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <p className="text-center text-sm text-ink-muted-48">
        Mã OTP đã được gửi tới <span className="font-medium text-ink">{email}</span>
      </p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="otp">Mã OTP</Label>
        <Input
          id="otp"
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          {...register("otp")}
        />
        {errors.otp ? <p className="text-sm text-danger">{errors.otp.message}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword">Mật khẩu mới</Label>
        <PasswordInput id="newPassword" autoComplete="new-password" {...register("newPassword")} />
        {errors.newPassword ? (
          <p className="text-sm text-danger">{errors.newPassword.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword ? (
          <p className="text-sm text-danger">{errors.confirmPassword.message}</p>
        ) : null}
      </div>

      <Button type="submit" disabled={resetPassword.isPending} className="mt-2">
        {resetPassword.isPending ? "Đang đặt lại…" : "Đặt lại mật khẩu"}
      </Button>

      <Button
        type="button"
        variant="secondary"
        disabled={cooldown > 0 || resend.isPending}
        onClick={handleResend}
      >
        {cooldown > 0
          ? `Gửi lại mã (${String(Math.floor(cooldown / 60)).padStart(2, "0")}:${String(cooldown % 60).padStart(2, "0")})`
          : "Gửi lại mã OTP"}
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [email, setEmail] = useState<string | null>(null);
  return email ? <ConfirmResetStep email={email} /> : <RequestOtpStep onSent={setEmail} />;
}
