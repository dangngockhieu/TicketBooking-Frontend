"use client";

import Link from "next/link";
import { CreditCard, KeyRound, LogOut, Ticket, UserCircle } from "lucide-react";
import { useAuthStore } from "@/features/auth/store";
import { useLogout } from "@/features/auth/hooks";
import { UserAvatar } from "@/components/common/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Menu tài khoản dùng chung cho SiteHeader (Customer) và topbar
 * Organizer/Admin — avatar + email + điều hướng hồ sơ + đăng xuất.
 */
export function AccountMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80"
          aria-label="Mở menu tài khoản"
        >
          <UserAvatar email={user.email} role={user.role} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role === "CUSTOMER" ? (
          <>
            <DropdownMenuItem asChild>
              <Link href="/me/bookings">
                <Ticket className="h-4 w-4" aria-hidden />
                Vé của tôi
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/me/payments">
                <CreditCard className="h-4 w-4" aria-hidden />
                Lịch sử giao dịch
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuItem asChild>
          <Link href="/me/profile">
            <UserCircle className="h-4 w-4" aria-hidden />
            Hồ sơ
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/me/security">
            <KeyRound className="h-4 w-4" aria-hidden />
            Bảo mật
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="text-danger data-[highlighted]:bg-danger/10 data-[highlighted]:text-danger"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {logout.isPending ? "Đang đăng xuất…" : "Đăng xuất"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
