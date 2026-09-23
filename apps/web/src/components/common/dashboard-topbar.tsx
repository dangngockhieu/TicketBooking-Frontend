import Link from "next/link";
import { AccountMenu } from "@/components/common/account-menu";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Logo } from "@/components/common/logo";

/** Topbar dùng chung cho layout Organizer/Admin — logo, theme toggle, avatar menu. `leading`: nút ☰ trên màn hẹp. */
export function DashboardTopbar({ leading }: { leading?: React.ReactNode }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-hairline bg-canvas px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {leading}
        <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold text-ink">
          <Logo size="sm" />
          <span className="truncate text-lg font-bold tracking-tight sm:text-xl">
            TicketBooking
          </span>
        </Link>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <ThemeToggle />
        <AccountMenu />
      </div>
    </header>
  );
}
