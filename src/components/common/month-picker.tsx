"use client";

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatMonthLabel, shiftMonthKey } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MonthKey } from "@/types/api";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const toKey = (year: number, month: number): MonthKey =>
  `${year}-${String(month).padStart(2, "0")}`;

/**
 * Chọn tháng: nút lùi/tiến để nhảy nhanh 1 tháng, hoặc bấm vào nhãn để mở lưới 12 tháng theo năm.
 * `max` chặn chọn tháng tương lai (chưa có dữ liệu).
 */
export function MonthPicker({
  value,
  onChange,
  max,
}: {
  value: MonthKey;
  onChange: (month: MonthKey) => void;
  max: MonthKey;
}) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => Number(value.slice(0, 4)));
  const maxYear = Number(max.slice(0, 4));

  function handleOpenChange(next: boolean) {
    if (next) setViewYear(Number(value.slice(0, 4)));
    setOpen(next);
  }

  function pick(month: MonthKey) {
    onChange(month);
    setOpen(false);
  }

  return (
    <div className="flex items-center gap-1 self-start rounded-pill border border-hairline bg-canvas p-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        aria-label="Tháng trước"
        onClick={() => onChange(shiftMonthKey(value, -1))}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </Button>

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-8 min-w-36 items-center justify-center gap-2 rounded-pill px-3 text-sm font-medium text-ink transition-colors hover:bg-canvas-parchment focus-visible:outline-2 focus-visible:outline-[var(--color-primary-focus)]"
            aria-label={`Chọn tháng, đang xem ${formatMonthLabel(value)}`}
          >
            <CalendarDays className="h-4 w-4 text-ink-muted-48" aria-hidden />
            {formatMonthLabel(value)}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="mb-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              aria-label="Năm trước"
              onClick={() => setViewYear((y) => y - 1)}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Button>
            <span className="text-sm font-semibold text-ink">{viewYear}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              aria-label="Năm sau"
              disabled={viewYear >= maxYear}
              onClick={() => setViewYear((y) => y + 1)}
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS.map((m) => {
              const key = toKey(viewYear, m);
              const selected = key === value;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={key > max}
                  aria-pressed={selected}
                  onClick={() => pick(key)}
                  className={cn(
                    "h-9 rounded-sm text-sm transition-colors disabled:pointer-events-none disabled:opacity-40",
                    selected
                      ? "bg-primary font-medium text-on-primary"
                      : "text-ink hover:bg-canvas-parchment",
                  )}
                >
                  Tháng {m}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        aria-label="Tháng sau"
        disabled={value >= max}
        onClick={() => onChange(shiftMonthKey(value, 1))}
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}
