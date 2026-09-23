import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-hairline px-6 py-16 text-center">
      <Icon className="h-10 w-10 text-ink-muted-48" aria-hidden />
      <p className="text-base font-medium text-ink">{title}</p>
      {description ? <p className="max-w-sm text-sm text-ink-muted-48">{description}</p> : null}
      {action}
    </div>
  );
}
