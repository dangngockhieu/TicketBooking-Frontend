import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-body-vn",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: {
    default: "TicketBooking — Mua vé sự kiện trực tuyến",
    template: "%s · TicketBooking",
  },
  description: "Tìm và đặt vé sự kiện, concert, hội thảo trực tuyến, thanh toán an toàn qua VNPay.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-canvas-parchment">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
