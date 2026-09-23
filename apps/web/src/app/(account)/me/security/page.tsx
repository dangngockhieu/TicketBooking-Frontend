import { ChangePasswordForm } from "@/features/auth/components/change-password-form";

export default function SecurityPage() {
  return (
    <div className="flex max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold text-ink">Bảo mật</h1>
      <ChangePasswordForm />
    </div>
  );
}
