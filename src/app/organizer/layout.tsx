"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, ScanLine } from "lucide-react";
import { RoleGuard } from "@/components/common/role-guard";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/organizer", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/organizer/events", label: "Sự kiện của tôi", icon: CalendarDays },
  { href: "/organizer/check-in", label: "Check-in", icon: ScanLine },
];

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <RoleGuard allow={["ORGANIZER"]}>
      <div className="flex min-h-screen">
        <aside className="hidden w-56 shrink-0 border-r border-hairline bg-canvas p-4 sm:block">
          <p className="mb-4 px-2 text-sm font-semibold text-ink">Organizer</p>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = pathname === item.href || (item.href !== "/organizer" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                    active ? "bg-primary text-on-primary" : "text-ink-muted-80 hover:bg-canvas-parchment",
                  )}
                >
                  <item.icon className="h-4 w-4" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 bg-canvas-parchment p-6">{children}</main>
      </div>
    </RoleGuard>
  );
}
