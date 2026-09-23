"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X, type LucideIcon } from "lucide-react";
import { DashboardTopbar } from "@/components/common/dashboard-topbar";
import { cn } from "@/lib/utils";

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

function NavLinks({
  items,
  rootHref,
  onNavigate,
}: {
  items: DashboardNavItem[];
  rootHref: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active =
          pathname === item.href || (item.href !== rootHref && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-primary text-on-primary" : "text-ink-muted-80 hover:bg-canvas-parchment",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Khung dùng chung cho Organizer/Admin: topbar + sidebar cố định, chỉ `<main>` cuộn.
 * Từ `lg` trở lên hiện sidebar; dưới `lg` (điện thoại, tablet dọc) sidebar thu vào nút ☰ trên topbar.
 */
export function DashboardShell({
  title,
  rootHref,
  items,
  children,
}: {
  title: string;
  rootHref: string;
  items: DashboardNavItem[];
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <DashboardTopbar
        leading={
          <DialogPrimitive.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <DialogPrimitive.Trigger
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-canvas-parchment lg:hidden"
              aria-label="Mở menu điều hướng"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </DialogPrimitive.Trigger>
            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay
                data-slot="overlay"
                className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              />
              <DialogPrimitive.Content
                data-slot="sheet"
                className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col gap-4 overflow-y-auto border-r border-hairline bg-canvas p-4 shadow-lg outline-none lg:hidden"
                aria-describedby={undefined}
              >
                <div className="flex items-center justify-between px-2">
                  <DialogPrimitive.Title className="text-sm font-semibold text-ink">
                    {title}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Close
                    className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted-48 hover:bg-canvas-parchment hover:text-ink"
                    aria-label="Đóng menu"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </DialogPrimitive.Close>
                </div>
                <NavLinks items={items} rootHref={rootHref} onNavigate={() => setMenuOpen(false)} />
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>
        }
      />
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-56 shrink-0 overflow-y-auto border-r border-hairline bg-canvas p-4 lg:block">
          <p className="mb-4 px-2 text-sm font-semibold text-ink">{title}</p>
          <NavLinks items={items} rootHref={rootHref} />
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto bg-canvas-parchment p-4 sm:p-6">
          {/* Chặn độ rộng trên màn lớn (1920+) — bảng/biểu đồ kéo giãn quá rộng khó đọc */}
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
