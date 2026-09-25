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
import { Link, router } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ApiError, fallbackErrorMessage } from "@ticketbooking/shared";
import { PasswordField, TextField } from "@/components/text-field";
import { useRegister } from "@/features/auth/hooks";
import { registerSchema, type RegisterInput } from "@/features/auth/schemas";

export default function RegisterScreen() {
  const registerMutation = useRegister();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    try {
      await registerMutation.mutateAsync({ email: values.email, password: values.password });
      router.push({ pathname: "/verify-email", params: { email: values.email } });
    } catch (err) {
      if (err instanceof ApiError && err.httpStatus === 400 && err.fieldErrors) {
        for (const [field, message] of Object.entries(err.fieldErrors)) {
          setError(field as keyof RegisterInput, { message });
        }
        return;
      }
      if (err instanceof ApiError && err.httpStatus === 409) {
        setError("email", { message: err.message });
        return;
      }
      setFormError(fallbackErrorMessage(err));
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Đăng ký</Text>

        {formError ? (
          <View style={styles.alert}>
            <Text style={styles.alertText}>{formError}</Text>
          </View>
        ) : null}

        <Controller
          control={control}
          name="email"
          defaultValue=""
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
              autoComplete="new-password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.password?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          defaultValue=""
          render={({ field }) => (
            <PasswordField
              label="Xác nhận mật khẩu"
              autoComplete="new-password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        <TouchableOpacity
          style={[
            styles.submitButton,
            registerMutation.isPending ? styles.submitButtonDisabled : null,
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={registerMutation.isPending}
        >
          <Text style={styles.submitButtonText}>
            {registerMutation.isPending ? "Đang đăng ký…" : "Đăng ký"}
          </Text>
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Đã có tài khoản? </Text>
          <Link href="/login" style={styles.footerLink}>
            Đăng nhập
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
    backgroundColor: "#fdf2f2",
    padding: 12,
  },
  alertText: { fontSize: 14, color: "#d92d20" },
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
