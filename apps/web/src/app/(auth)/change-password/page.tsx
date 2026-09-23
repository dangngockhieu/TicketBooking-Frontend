"use client";

import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { useAuthStore } from "@/features/auth/store";

export default function ChangePasswordPage() {
  const requirePasswordChange = useAuthStore((s) => s.requirePasswordChange);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-ink">Đổi mật khẩu</h1>
        {requirePasswordChange ? (
          <p className="mt-1 text-sm text-ink-muted-48">
            Bạn đang dùng mật khẩu tạm — vui lòng đặt mật khẩu mới để tiếp tục.
          </p>
        ) : null}
      </div>
      <ChangePasswordForm required={requirePasswordChange} />
    </div>
  );
}
