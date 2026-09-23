import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "@/components/common/social-icons";
import { Logo } from "@/components/common/logo";
import { cn } from "@/lib/utils";

const LINK_COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Khám phá",
    links: [
      { label: "Sự kiện nổi bật", href: "/events" },
      { label: "Âm nhạc", href: "/categories/am-nhac" },
      { label: "Thể thao", href: "/categories/the-thao" },
      { label: "Sân khấu", href: "/categories/san-khau" },
    ],
  },
  {
    title: "Tài khoản",
    links: [
      { label: "Đăng nhập", href: "/login" },
      { label: "Đăng ký", href: "/register" },
      { label: "Vé của tôi", href: "/me/bookings" },
      { label: "Lịch sử giao dịch", href: "/me/payments" },
    ],
  },
  {
    title: "Dành cho ban tổ chức",
    links: [
      { label: "Kênh Organizer", href: "/organizer" },
      { label: "Quản lý sự kiện", href: "/organizer/events" },
      { label: "Check-in tại cổng", href: "/organizer/check-in" },
    ],
  },
];

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "https://facebook.com",
    icon: FacebookIcon,
    iconColorClass: "text-[#1877f2]",
  },
  { label: "Instagram", href: "https://instagram.com", icon: InstagramIcon, iconColorClass: "" },
  {
    label: "YouTube",
    href: "https://youtube.com",
    icon: YoutubeIcon,
    iconColorClass: "text-[#ff0000]",
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-hairline bg-canvas-parchment text-ink-muted-80">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
              <Logo />
              <span className="text-2xl font-bold tracking-tight">TicketBooking</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-ink-muted-48">
              Nền tảng đặt vé sự kiện trực tuyến — tìm sự kiện, giữ chỗ, thanh toán an toàn qua
              VNPay và nhận vé điện tử có mã QR chỉ trong vài phút.
            </p>
            <ul className="flex flex-col gap-2 text-sm text-ink-muted-48">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                Hà Nội, Việt Nam
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" aria-hidden />
                <a href="mailto:hotro@ticketbooking.vn" className="hover:text-primary">
                  hotro@ticketbooking.vn
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" aria-hidden />
                <a href="tel:19001234" className="hover:text-primary">
                  1900 1234
                </a>
              </li>
            </ul>
          </div>

          {LINK_COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-ink">{column.title}</h3>
              <ul className="flex flex-col gap-1 leading-[2.41] text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-ink-muted-80 hover:text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-muted-48">
            © {new Date().getFullYear()} TicketBooking. Bảo lưu mọi quyền.
          </p>

          <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-canvas transition-transform hover:scale-110 hover:shadow-md"
              >
                <social.icon className={cn("h-6 w-6", social.iconColorClass)} aria-hidden />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
