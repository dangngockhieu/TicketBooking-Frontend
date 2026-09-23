"use client";

import { LayoutDashboard, Tags, Users, CalendarRange, Banknote } from "lucide-react";
import { RoleGuard } from "@/components/common/role-guard";
import { DashboardShell, type DashboardNavItem } from "@/components/common/dashboard-shell";

const NAV: DashboardNavItem[] = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/organizers", label: "Organizer", icon: Users },
  { href: "/admin/categories", label: "Danh mục", icon: Tags },
  { href: "/admin/events", label: "Sự kiện & phí", icon: CalendarRange },
  { href: "/admin/payouts", label: "Yêu cầu rút tiền", icon: Banknote },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allow={["ADMIN"]}>
      <DashboardShell title="Admin" rootHref="/admin" items={NAV}>
        {children}
      </DashboardShell>
    </RoleGuard>
  );
}
