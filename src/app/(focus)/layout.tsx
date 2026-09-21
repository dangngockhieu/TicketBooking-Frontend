"use client";

import Link from "next/link";
import { Ticket } from "lucide-react";
import { RoleGuard } from "@/components/common/role-guard";

/** Layout "focus" — ẩn điều hướng để giảm rời trang trong lúc giữ chỗ/phòng chờ. Docs/03 §3. */
export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allow={["CUSTOMER"]}>
      <div className="flex min-h-screen flex-col bg-canvas-parchment">
        <header className="border-b border-hairline bg-canvas px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
            <Ticket className="h-5 w-5 text-primary" aria-hidden />
            TicketBooking
          </Link>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </RoleGuard>
  );
}
