import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Link, router, useLocalSearchParams } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ApiError, LOGIN_ERROR_MESSAGES, classifyLoginError } from "@ticketbooking/shared";
import { PasswordField, TextField } from "@/components/text-field";
import { useLogin } from "@/features/auth/hooks";
import { homeOf } from "@/lib/store";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";

export default function LoginScreen() {
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const login = useLogin();
  const [alert, setAlert] = useState<{
    kind: "unverified" | "locked" | "generic";
    message: string;
  } | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setAlert(null);
    try {
      const res = await login.mutateAsync(values);
      if (res.requirePasswordChange) {
        router.replace("/change-password" as never);
        return;
      }
      router.replace(homeOf(res.user.role) as never);
    } catch (err) {
      if (err instanceof ApiError && err.httpStatus === 400 && err.fieldErrors) {
        for (const [field, message] of Object.entries(err.fieldErrors)) {
          setError(field as keyof LoginInput, { message });
        }
        return;
      }
      if (err instanceof ApiError && err.httpStatus === 401) {
        const kind = classifyLoginError(err);
        if (kind === "invalid-credentials") {
          setError("password", { message: LOGIN_ERROR_MESSAGES["invalid-credentials"] });
          return;
        }
        setAlert({
          kind: kind === "unknown" ? "generic" : kind,
          message: LOGIN_ERROR_MESSAGES[kind],
        });
        return;
      }
      setAlert({ kind: "generic", message: "Có lỗi xảy ra, vui lòng thử lại." });
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Đăng nhập</Text>

        {alert ? (
          <View style={styles.alert}>
            <Text style={styles.alertText}>{alert.message}</Text>
            {alert.kind === "unverified" ? (
              <Link
                href={{ pathname: "/verify-email", params: { email: emailParam ?? "" } }}
                style={styles.alertLink}
              >
                Xác thực ngay
              </Link>
            ) : null}
          </View>
        ) : null}

        <Controller
          control={control}
          name="email"
          defaultValue={emailParam ?? ""}
          render={({ field }) => (
            <TextField
              label="Email"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          defaultValue=""
          render={({ field }) => (
            <PasswordField
              label="Mật khẩu"
              autoComplete="current-password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.password?.message}
            />
          )}
        />

        <Link href={"/reset-password" as never} style={styles.forgotLink}>
          Quên mật khẩu?
        </Link>

        <TouchableOpacity
          style={[styles.submitButton, login.isPending ? styles.submitButtonDisabled : null]}
          onPress={handleSubmit(onSubmit)}
          disabled={login.isPending}
        >
          <Text style={styles.submitButtonText}>
            {login.isPending ? "Đang đăng nhập…" : "Đăng nhập"}
          </Text>
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Chưa có tài khoản? </Text>
          <Link href="/register" style={styles.footerLink}>
            Đăng ký
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  container: { flexGrow: 1, padding: 24, gap: 16, justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "700", color: "#1d1d1f", marginBottom: 8 },
  alert: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    backgroundColor: "#f8f5f0",
    padding: 12,
    gap: 4,
  },
  alertText: { fontSize: 14, color: "#1d1d1f" },
  alertLink: { fontSize: 14, fontWeight: "600", color: "#4f46e5" },
  forgotLink: { alignSelf: "flex-end", fontSize: 14, fontWeight: "500", color: "#4f46e5" },
  submitButton: {
    height: 50,
    borderRadius: 10,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
  footerText: { fontSize: 14, color: "#6b6b70" },
  footerLink: { fontSize: 14, fontWeight: "600", color: "#4f46e5" },
});
