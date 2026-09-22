"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

/**
 * Chuyển sáng/tối. Render cả 2 icon và ẩn/hiện bằng CSS (thay vì if theo
 * `resolvedTheme` ở JS) để tránh mismatch hydration mà không cần state
 * "mounted" phụ — xem next-themes docs "Avoid Hydration Mismatch".
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Chuyển đổi giao diện sáng/tối"
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-canvas text-ink transition-colors hover:border-primary hover:text-primary",
        className,
      )}
    >
      <Sun className="hidden h-4 w-4 dark:block" aria-hidden />
      <Moon className="block h-4 w-4 dark:hidden" aria-hidden />
    </button>
  );
}
