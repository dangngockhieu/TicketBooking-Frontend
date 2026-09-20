import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata = { title: "Đăng ký" };

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-center text-xl font-semibold text-ink">Tạo tài khoản</h1>
      <RegisterForm />
    </div>
  );
}
