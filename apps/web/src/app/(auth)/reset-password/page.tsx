import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata = { title: "Đặt lại mật khẩu" };

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-center text-xl font-semibold text-ink">Đặt lại mật khẩu</h1>
      <ResetPasswordForm />
    </div>
  );
}
