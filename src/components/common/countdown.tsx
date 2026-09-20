"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/format";
import { serverTime } from "@/lib/server-time";
import { cn } from "@/lib/utils";

/**
 * Đếm ngược tới `targetIso`, luôn tính lại từ serverTime.now() mỗi tick (không cộng
 * dồn) — không trôi khi tab bị throttle. Xem docs/06-booking-payment-flow.md §3.
 */
export function Countdown({
  targetIso,
  onExpire,
  className,
}: {
  targetIso: string;
  onExpire?: () => void;
  className?: string;
}) {
  const target = Date.parse(targetIso);
  const [remaining, setRemaining] = useState(() => target - serverTime.now());

  useEffect(() => {
    const tick = () => {
      const next = target - serverTime.now();
      setRemaining(next);
      if (next <= 0) onExpire?.();
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [target, onExpire]);

  const danger = remaining <= 60_000;

  return (
    <span
      className={cn("font-mono text-lg font-semibold tabular-nums", danger && "text-danger", className)}
      aria-live={danger ? "assertive" : "off"}
    >
      {formatCountdown(remaining)}
    </span>
  );
}
