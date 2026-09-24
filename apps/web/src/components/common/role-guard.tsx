"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/features/auth/store";
import type { Role } from "@ticketbooking/shared";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Guard phía client: chờ bootstrap xong, kiểm tra role, ép đổi mật khẩu nếu cần.
 * middleware.ts đã chặn theo cookie ở edge; đây là lớp kiểm tra role + trạng thái
 * chi tiết hơn — xem docs/03-sitemap-routing.md §2.
 */
export function RoleGuard({ allow, children }: { allow: Role[]; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const requirePasswordChange = useAuthStore((s) => s.requirePasswordChange);

  useEffect(() => {
    if (status === "loading" || status === "idle") return;
    if (status === "anonymous") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (requirePasswordChange && pathname !== "/change-password") {
      router.replace("/change-password");
      return;
    }
    if (user && !allow.includes(user.role)) {
      router.replace("/403");
    }
  }, [status, user, requirePasswordChange, allow, pathname, router]);

  if (status === "loading" || status === "idle" || status === "anonymous") {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (user && !allow.includes(user.role)) return null;

  return children;
}
