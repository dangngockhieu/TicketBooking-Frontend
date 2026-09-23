"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/features/auth/hooks";
import { homeOf } from "@/features/auth/store";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";
import { ApiError } from "@/types/api";
import { classifyLoginError, LOGIN_ERROR_MESSAGES } from "@/lib/error-messages";

/** Chỉ cho phép next bắt đầu bằng "/" và không phải "//..." (chặn open redirect). */
function safeNext(next: string | null): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const [alert, setAlert] = useState<{
    kind: "unverified" | "locked" | "generic";
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setAlert(null);
    try {
      const res = await login.mutateAsync(values);
      const next = safeNext(searchParams.get("next"));
      if (res.requirePasswordChange) {
        router.replace("/change-password");
        return;
      }
      router.replace(next ?? homeOf(res.user.role));
    } catch (err) {
      if (err instanceof ApiError && err.httpStatus === 400 && err.fieldErrors) {
        for (const [field, message] of Object.entries(err.fieldErrors)) {
          setError(field as keyof LoginInput, { message });
        }
        return;
      }
      if (err instanceof ApiError && err.httpStatus === 401) {
        const kind = classifyLoginError(err);
        if (kind === "invalid-credentials") {
          setError("password", { message: LOGIN_ERROR_MESSAGES["invalid-credentials"] });
          return;
        }
        setAlert({
          kind: kind === "unknown" ? "generic" : kind,
          message: LOGIN_ERROR_MESSAGES[kind],
        });
        return;
      }
      setAlert({ kind: "generic", message: "Có lỗi xảy ra, vui lòng thử lại." });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {alert ? (
        <div
          role="alert"
          className="rounded-md border border-hairline bg-canvas-parchment p-3 text-sm text-ink"
        >
          {alert.message}
          {alert.kind === "unverified" ? (
            <Link
              href={`/verify-email?email=${encodeURIComponent(searchParams.get("email") ?? "")}`}
              className="ml-2 font-medium text-primary"
            >
              Xác thực ngay
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email ? <p className="text-sm text-danger">{errors.email.message}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Mật khẩu</Label>
          <Link href="/reset-password" className="text-sm font-medium text-primary">
            Quên mật khẩu?
          </Link>
        </div>
        <PasswordInput id="password" autoComplete="current-password" {...register("password")} />
        {errors.password ? <p className="text-sm text-danger">{errors.password.message}</p> : null}
      </div>

      <Button type="submit" disabled={login.isPending} className="mt-2">
        {login.isPending ? "Đang đăng nhập…" : "Đăng nhập"}
      </Button>

      <p className="text-center text-sm text-ink-muted-48">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-medium text-primary">
          Đăng ký
        </Link>
      </p>
    </form>
  );
}
