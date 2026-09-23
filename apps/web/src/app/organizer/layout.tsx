"use client";

import { LayoutDashboard, CalendarDays, ScanLine, Wallet } from "lucide-react";
import { RoleGuard } from "@/components/common/role-guard";
import { DashboardShell, type DashboardNavItem } from "@/components/common/dashboard-shell";

const NAV: DashboardNavItem[] = [
  { href: "/organizer", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/organizer/events", label: "Sự kiện của tôi", icon: CalendarDays },
  { href: "/organizer/check-in", label: "Check-in", icon: ScanLine },
  { href: "/organizer/wallet", label: "Ví của tôi", icon: Wallet },
];

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allow={["ORGANIZER"]}>
      <DashboardShell title="Organizer" rootHref="/organizer" items={NAV}>
        {children}
      </DashboardShell>
    </RoleGuard>
  );
}
