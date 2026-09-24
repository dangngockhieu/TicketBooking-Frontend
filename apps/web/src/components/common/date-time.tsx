import { formatDate, formatDateTime, formatTime } from "@ticketbooking/shared";

export function DateTime({
  iso,
  variant = "full",
  className,
}: {
  iso: string;
  variant?: "full" | "date" | "time";
  className?: string;
}) {
  const text =
    variant === "date"
      ? formatDate(iso)
      : variant === "time"
        ? formatTime(iso)
        : formatDateTime(iso);
  return (
    <time dateTime={iso} className={className}>
      {text}
    </time>
  );
}
