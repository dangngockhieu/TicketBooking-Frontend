import Link from "next/link";
import { Ticket } from "lucide-react";
import { AccountMenu } from "@/components/common/account-menu";
import { ThemeToggle } from "@/components/common/theme-toggle";

/** Topbar dùng chung cho layout Organizer/Admin — logo, theme toggle, avatar menu. */
export function DashboardTopbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-hairline bg-canvas px-6">
      <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
        <Ticket className="h-5 w-5 text-primary" aria-hidden />
        <span>TicketBooking</span>
      </Link>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <AccountMenu />
      </div>
    </header>
  );
}
