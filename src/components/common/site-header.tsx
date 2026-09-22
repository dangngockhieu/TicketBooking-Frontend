"use client";

import Link from "next/link";
import { Search, Ticket } from "lucide-react";
import { useAuthStore } from "@/features/auth/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { AccountMenu } from "@/components/common/account-menu";

export function SiteHeader() {
  const status = useAuthStore((s) => s.status);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
          <Ticket className="h-6 w-6 text-primary" aria-hidden />
          <span className="text-lg tracking-tight">TicketBooking</span>
        </Link>

        <form action="/events" className="relative ml-4 hidden flex-1 max-w-md sm:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted-48" />
          <Input
            name="keyword"
            placeholder="Tìm sự kiện, nghệ sĩ…"
            className="rounded-pill pl-10"
          />
        </form>

        <nav className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          {status === "authenticated" ? (
            <AccountMenu />
          ) : (
            <Link href="/login">
              <Button variant="secondary" size="sm">
                Đăng nhập
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
