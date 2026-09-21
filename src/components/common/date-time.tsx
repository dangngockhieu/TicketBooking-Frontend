import { formatDate, formatDateTime, formatTime } from "@/lib/format";

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
