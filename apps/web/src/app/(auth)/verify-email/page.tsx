import { Suspense } from "react";
import { VerifyEmailPageContent } from "@/features/auth/components/verify-email-page-content";

export const metadata = { title: "Xác thực email" };

export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-center text-xl font-semibold text-ink">Xác thực email</h1>
      <Suspense>
        <VerifyEmailPageContent />
      </Suspense>
    </div>
  );
}
