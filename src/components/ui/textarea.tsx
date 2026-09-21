import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-24 w-full rounded-md border border-hairline bg-canvas px-4 py-2 text-[15px] text-ink placeholder:text-ink-muted-48 outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-focus/30 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
