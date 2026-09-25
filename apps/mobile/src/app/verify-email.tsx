import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ApiError, fallbackErrorMessage } from "@ticketbooking/shared";
import { useResendVerification, useVerifyEmail } from "@/features/auth/hooks";
import { homeOf } from "@/lib/store";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_S = 60;

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const verifyEmail = useVerifyEmail();
  const resend = useResendVerification();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function submitOtp(otp: string) {
    setError(null);
    setInfo(null);
    try {
      const res = await verifyEmail.mutateAsync({ email: email ?? "", otp });
      router.replace(homeOf(res.user.role) as never);
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

  function handleKeyDown(index: number, key: string) {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  async function handleResend() {
    setError(null);
    setInfo(null);
    try {
      await resend.mutateAsync({ email: email ?? "" });
      setInfo("Đã gửi lại mã xác thực");
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
    <View style={styles.container}>
      <Text style={styles.title}>Xác thực email</Text>
      <Text style={styles.subtitle}>
        Mã gồm 6 số đã được gửi tới <Text style={styles.email}>{email}</Text>
      </Text>

      <View style={styles.otpRow}>
        {digits.map((d, i) => (
          <TextInput
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            value={d}
            onChangeText={(v) => handleChange(i, v)}
            onKeyPress={(e) => handleKeyDown(i, e.nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={1}
            style={styles.otpInput}
          />
        ))}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {info ? <Text style={styles.infoText}>{info}</Text> : null}

      <TouchableOpacity
        style={[styles.resendButton, cooldown > 0 || resend.isPending ? styles.disabled : null]}
        onPress={handleResend}
        disabled={cooldown > 0 || resend.isPending}
      >
        <Text style={styles.resendButtonText}>
          {cooldown > 0
            ? `Gửi lại mã (${String(Math.floor(cooldown / 60)).padStart(2, "0")}:${String(
                cooldown % 60,
              ).padStart(2, "0")})`
            : "Gửi lại mã"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    alignItems: "center",
    gap: 16,
    justifyContent: "center",
  },
  title: { fontSize: 26, fontWeight: "700", color: "#1d1d1f" },
  subtitle: { fontSize: 14, color: "#6b6b70", textAlign: "center" },
  email: { fontWeight: "600", color: "#1d1d1f" },
  otpRow: { flexDirection: "row", gap: 8 },
  otpInput: {
    height: 56,
    width: 44,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    borderRadius: 10,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: "#1d1d1f",
  },
  errorText: { fontSize: 14, color: "#d92d20", textAlign: "center" },
  infoText: { fontSize: 14, color: "#059669", textAlign: "center" },
  resendButton: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.5 },
  resendButtonText: { fontSize: 14, fontWeight: "600", color: "#1d1d1f" },
});
