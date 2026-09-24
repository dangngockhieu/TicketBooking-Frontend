import { useEffect, useState } from "react";
import { Text } from "react-native";
import { formatCountdown } from "@ticketbooking/shared";
import { serverTime } from "@/lib/server-time";

/**
 * Đếm ngược tới `targetIso`, luôn tính lại từ serverTime.now() mỗi tick (không cộng
 * dồn) — không trôi khi app bị đưa xuống nền rồi quay lại. Xem
 * docs/06-booking-payment-flow.md §3.
 */
export function Countdown({ targetIso, onExpire }: { targetIso: string; onExpire?: () => void }) {
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
    <Text
      style={{
        fontVariant: ["tabular-nums"],
        fontWeight: "600",
        fontSize: 18,
        color: danger ? "#d92d20" : "#1d1d1f",
      }}
      accessibilityLiveRegion={danger ? "assertive" : "none"}
    >
      {formatCountdown(remaining)}
    </Text>
  );
}
