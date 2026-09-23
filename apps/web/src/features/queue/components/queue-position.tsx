export function QueuePosition({
  position,
  totalWaiting,
  estimatedWaitSeconds,
  initialPosition,
}: {
  position: number;
  totalWaiting: number;
  estimatedWaitSeconds: number;
  initialPosition: number;
}) {
  const progress =
    initialPosition > 0 ? Math.min(1, Math.max(0, 1 - position / initialPosition)) : 0;
  const etaMinutes = Math.max(1, Math.round(estimatedWaitSeconds / 60));

  return (
    <div className="flex w-full flex-col items-center gap-3" aria-live="polite">
      <p className="text-sm text-ink-muted-48">Bạn đang ở vị trí</p>
      <p className="text-4xl font-semibold tabular-nums text-ink">
        #{position.toLocaleString("vi-VN")}
      </p>

      <div className="h-2 w-full max-w-xs overflow-hidden rounded-pill bg-canvas-parchment">
        <div
          className="h-full rounded-pill bg-primary transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <p className="text-sm text-ink-muted-48">Thời gian chờ ước tính: ~ {etaMinutes} phút</p>
      <p className="text-sm text-ink-muted-48">
        Tổng số người đang chờ: {totalWaiting.toLocaleString("vi-VN")}
      </p>
    </div>
  );
}
