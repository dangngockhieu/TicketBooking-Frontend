import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata = { title: "Đăng nhập" };

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-center text-xl font-semibold text-ink">Đăng nhập</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
