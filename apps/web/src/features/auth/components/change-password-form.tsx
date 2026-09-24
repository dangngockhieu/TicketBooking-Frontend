"use client";
import { ApiError, fallbackErrorMessage } from "@ticketbooking/shared";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useChangePassword } from "@/features/auth/hooks";
import { changePasswordSchema, type ChangePasswordInput } from "@/features/auth/schemas";

/** required=true: đổi mật khẩu bắt buộc lần đầu (Organizer) — ẩn nút Hủy. Xem docs/04-auth-flow.md §3.3c. */
export function ChangePasswordForm({ required = false }: { required?: boolean }) {
  const router = useRouter();
  const changePassword = useChangePassword();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  async function onSubmit(values: ChangePasswordInput) {
    try {
      await changePassword.mutateAsync(values);
      toast.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      router.replace("/login?next=/organizer");
    } catch (err) {
      if (err instanceof ApiError && err.httpStatus === 401) {
        setError("currentPassword", { message: "Mật khẩu hiện tại không chính xác" });
        return;
      }
      if (err instanceof ApiError && err.httpStatus === 400 && err.fieldErrors) {
        for (const [field, message] of Object.entries(err.fieldErrors)) {
          setError(field as keyof ChangePasswordInput, { message });
        }
        return;
      }
      toast.error(fallbackErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
        <PasswordInput
          id="currentPassword"
          autoComplete="current-password"
          {...register("currentPassword")}
        />
        {errors.currentPassword ? (
          <p className="text-sm text-danger">{errors.currentPassword.message}</p>
        ) : null}
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

      <div className="mt-2 flex gap-2">
        <Button type="submit" disabled={changePassword.isPending} className="flex-1">
          {changePassword.isPending ? "Đang đổi…" : "Đổi mật khẩu"}
        </Button>
        {!required ? (
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Hủy
          </Button>
        ) : null}
      </div>
    </form>
  );
}
