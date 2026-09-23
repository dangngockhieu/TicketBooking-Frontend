"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/features/auth/store";
import { cn } from "@/lib/utils";

const CUSTOMER_NAV = [
  { href: "/me/bookings", label: "Vé của tôi" },
  { href: "/me/payments", label: "Lịch sử giao dịch" },
];

const COMMON_NAV = [
  { href: "/me/profile", label: "Hồ sơ" },
  { href: "/me/security", label: "Bảo mật" },
];

/** Thanh tab điều hướng /me/** — mục Vé/Thanh toán chỉ Customer mới thấy. */
export function AccountNav() {
  const role = useAuthStore((s) => s.user?.role);
  const pathname = usePathname();
  const items = role === "CUSTOMER" ? [...CUSTOMER_NAV, ...COMMON_NAV] : COMMON_NAV;

  return (
    <nav className="scrollbar-none -mx-4 mb-6 flex gap-2 overflow-x-auto border-b border-hairline px-4 pb-2 sm:mx-0 sm:px-0">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium hover:bg-canvas-parchment hover:text-ink",
            pathname === item.href ? "bg-canvas-parchment text-ink" : "text-ink-muted-80",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
