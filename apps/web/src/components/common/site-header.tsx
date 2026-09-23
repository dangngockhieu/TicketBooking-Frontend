"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useAuthStore } from "@/features/auth/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { AccountMenu } from "@/components/common/account-menu";
import { Logo } from "@/components/common/logo";

export function SiteHeader() {
  const status = useAuthStore((s) => s.status);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-4">
        <Link
          href="/"
          aria-label="TicketBooking — Trang chủ"
          className="flex min-w-0 items-center gap-2 font-semibold text-ink"
        >
          <Logo />
          {/* < sm: chỉ logo — chữ không đủ chỗ cạnh nút tìm kiếm/theme/đăng nhập ở 375px */}
          <span className="hidden text-2xl font-bold tracking-tight sm:inline">TicketBooking</span>
        </Link>

        <form action="/events" className="relative ml-4 hidden max-w-md flex-1 sm:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted-48" />
          <Input
            name="keyword"
            placeholder="Tìm sự kiện, nghệ sĩ…"
            className="rounded-pill pl-10"
          />
        </form>

        <nav className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/events"
            aria-label="Tìm sự kiện"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-canvas-parchment sm:hidden"
          >
            <Search className="h-5 w-5" aria-hidden />
          </Link>
          <ThemeToggle />
          {status === "authenticated" ? (
            <AccountMenu />
          ) : (
            <Button asChild variant="secondary" size="sm">
              <Link href="/login">Đăng nhập</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
