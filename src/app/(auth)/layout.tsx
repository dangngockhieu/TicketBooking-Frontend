import Link from "next/link";
import { Ticket } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-canvas-parchment px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 font-semibold text-ink">
        <Ticket className="h-6 w-6 text-primary" aria-hidden />
        <span className="text-lg tracking-tight">TicketBooking</span>
      </Link>
      <div className="w-full max-w-sm rounded-lg border border-hairline bg-canvas p-8 shadow-sm">
        {children}
      </div>
    </main>
  );
}
