"use client";

import { RoleGuard } from "@/components/common/role-guard";
import { SiteHeader } from "@/components/common/site-header";
import { SiteFooter } from "@/components/common/site-footer";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allow={["CUSTOMER"]}>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </RoleGuard>
  );
}
