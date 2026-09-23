"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function RequestEmailForm({ onSubmit }: { onSubmit: (email: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.includes("@")) onSubmit(value);
      }}
    >
      <p className="text-sm text-ink-muted-48">
        Nhập email bạn đã đăng ký để nhận lại mã xác thực.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
        />
      </div>
      <Button type="submit">Tiếp tục</Button>
    </form>
  );
}

export function VerifyEmailPageContent() {
  const searchParams = useSearchParams();
  const queryEmail = searchParams.get("email");
  const storedEmail =
    typeof window !== "undefined" ? window.sessionStorage.getItem("pending-email") : null;
  const [email, setEmail] = useState<string | null>(queryEmail ?? storedEmail);

  return email ? <VerifyEmailForm email={email} /> : <RequestEmailForm onSubmit={setEmail} />;
}
