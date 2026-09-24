import { Stack } from "expo-router";
import { AuthProvider } from "@/features/auth/auth-provider";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerTitleAlign: "center" }} />
    </AuthProvider>
  );
}
