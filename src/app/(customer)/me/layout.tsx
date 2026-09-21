import Link from "next/link";

const NAV = [
  { href: "/me/bookings", label: "Vé của tôi" },
  { href: "/me/payments", label: "Lịch sử giao dịch" },
  { href: "/me/profile", label: "Hồ sơ" },
];

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <nav className="flex gap-2 border-b border-hairline pb-2">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-2 text-sm font-medium text-ink-muted-80 hover:bg-canvas-parchment hover:text-ink"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
