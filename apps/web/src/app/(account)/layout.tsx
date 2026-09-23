"use client";

import { RoleGuard } from "@/components/common/role-guard";
import { SiteHeader } from "@/components/common/site-header";
import { SiteFooter } from "@/components/common/site-footer";
import { AccountNav } from "@/components/common/account-nav";

/**
 * Hồ sơ + bảo mật dùng chung cho mọi role đã đăng nhập — xem
 * docs/03-sitemap-routing.md ("/me/profile, /me/security | Mọi role đã đăng nhập").
 */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allow={["CUSTOMER", "ORGANIZER", "ADMIN"]}>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <AccountNav />
          {children}
        </div>
      </main>
      <SiteFooter />
    </RoleGuard>
  );
}
