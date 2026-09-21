"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister } from "@/features/auth/hooks";
import { registerSchema, type RegisterInput } from "@/features/auth/schemas";
import { ApiError } from "@/types/api";
import { fallbackErrorMessage } from "@/lib/error-messages";
import { useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const registerMutation = useRegister();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    try {
      await registerMutation.mutateAsync({ email: values.email, password: values.password });
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("pending-email", values.email);
      }
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (err) {
      if (err instanceof ApiError && err.httpStatus === 400 && err.fieldErrors) {
        for (const [field, message] of Object.entries(err.fieldErrors)) {
          setError(field as keyof RegisterInput, { message });
        }
        return;
      }
      if (err instanceof ApiError && err.httpStatus === 409) {
        setError("email", { message: err.message });
        return;
      }
      setFormError(fallbackErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
        {errors.password ? <p className="text-sm text-danger">{errors.password.message}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword ? (
          <p className="text-sm text-danger">{errors.confirmPassword.message}</p>
        ) : null}
      </div>

      <Button type="submit" disabled={registerMutation.isPending} className="mt-2">
        {registerMutation.isPending ? "Đang đăng ký…" : "Đăng ký"}
      </Button>

      <p className="text-center text-sm text-ink-muted-48">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-medium text-primary">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
