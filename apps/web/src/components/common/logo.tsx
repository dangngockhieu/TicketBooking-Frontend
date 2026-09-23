import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  sm: "h-8 w-[3rem]",
  md: "h-9 w-[3.375rem]",
} as const;

/** Logo vé (`public/logo.png`) — hiện nguyên ảnh gốc (tỉ lệ 3:2), không bo tròn/vuông. */
export function Logo({
  size = "md",
  className,
}: {
  size?: keyof typeof SIZE_CLASS;
  className?: string;
}) {
  return (
    <Image
      src="/logo.png"
      alt="TicketBooking"
      width={96}
      height={64}
      className={cn("shrink-0 object-contain", SIZE_CLASS[size], className)}
      priority
    />
  );
}
