import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { router, useSegments } from "expo-router";
import { useAuthStore } from "@/lib/store";
import type { UserInfo } from "@ticketbooking/shared";

/**
 * Guard phía client cho các route group theo role (VD: /organizer). Không có edge
 * middleware như web (proxy.ts) — mobile chỉ có lớp kiểm tra này. Xem
 * apps/web/src/components/common/role-guard.tsx (tương đương).
 */
export function RoleGuard({
  allow,
  children,
}: {
  allow: UserInfo["role"][];
  children: React.ReactNode;
}) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const requirePasswordChange = useAuthStore((s) => s.requirePasswordChange);
  const segments = useSegments();

  useEffect(() => {
    if (status === "loading" || status === "idle") return;
    if (status === "anonymous") {
      router.replace("/login");
      return;
    }
    if (requirePasswordChange && !segments.includes("change-password" as never)) {
      router.replace("/change-password" as never);
      return;
    }
    if (user && !allow.includes(user.role)) {
      router.replace("/");
    }
  }, [status, user, requirePasswordChange, allow, segments]);

  if (status === "loading" || status === "idle" || status === "anonymous") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (user && !allow.includes(user.role)) return null;

  return children;
}
