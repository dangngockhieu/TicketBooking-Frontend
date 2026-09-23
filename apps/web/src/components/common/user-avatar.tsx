import { cn } from "@/lib/utils";
import type { Role } from "@/types/api";

const ROLE_BG: Record<Role, string> = {
  CUSTOMER: "bg-primary",
  ORGANIZER: "bg-success",
  ADMIN: "bg-danger",
};

/** Avatar tròn hiển thị chữ cái đầu email, màu nền đổi theo role. */
export function UserAvatar({
  email,
  role,
  className,
}: {
  email: string;
  role: Role;
  className?: string;
}) {
  const initial = email.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-on-primary",
        ROLE_BG[role],
        className,
      )}
      aria-hidden
    >
      {initial}
    </span>
  );
}
