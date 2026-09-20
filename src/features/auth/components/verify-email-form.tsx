"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useResendVerification, useVerifyEmail } from "@/features/auth/hooks";
import { homeOf } from "@/features/auth/store";
import { ApiError } from "@/types/api";
import { fallbackErrorMessage } from "@/lib/error-messages";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_S = 60;

export function VerifyEmailForm({ email }: { email: string }) {
  const router = useRouter();
  const verifyEmail = useVerifyEmail();
  const resend = useResendVerification();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function submitOtp(otp: string) {
    setError(null);
    try {
      const res = await verifyEmail.mutateAsync({ email, otp });
      toast.success("Xác thực email thành công");
      router.replace(homeOf(res.user.role));
    } catch (err) {
      if (err instanceof ApiError && err.httpStatus === 400) {
        setError(err.fieldErrors?.otp ?? err.message ?? "Mã OTP không chính xác.");
      } else {
        setError(fallbackErrorMessage(err));
      }
      setDigits(Array(OTP_LENGTH).fill(""));
      inputsRef.current[0]?.focus();
    }
  }

  function handleChange(index: number, value: string) {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);

    if (char && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (next.every((d) => d !== "") && next.join("").length === OTP_LENGTH) {
      submitOtp(next.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  async function handleResend() {
    setError(null);
    try {
      await resend.mutateAsync({ email });
      toast.success("Đã gửi lại mã xác thực");
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      if (err instanceof ApiError && err.httpStatus === 429) {
        setError("Vui lòng đợi trước khi gửi lại mã.");
        return;
      }
      setError(fallbackErrorMessage(err));
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-center text-sm text-ink-muted-48">
        Mã gồm 6 số đã được gửi tới <span className="font-medium text-ink">{email}</span>
      </p>

      <div className="flex gap-2" role="group" aria-label="Nhập mã OTP">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            inputMode="numeric"
            maxLength={1}
            aria-label={`Chữ số ${i + 1}`}
            className="h-14 w-11 rounded-md border border-hairline text-center text-xl font-semibold outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-focus/30"
          />
        ))}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      <Button type="button" variant="secondary" disabled={cooldown > 0 || resend.isPending} onClick={handleResend}>
        {cooldown > 0 ? `Gửi lại mã (${String(Math.floor(cooldown / 60)).padStart(2, "0")}:${String(cooldown % 60).padStart(2, "0")})` : "Gửi lại mã"}
      </Button>
    </div>
  );
}
