import { cn } from "@/lib/utils";

const LABEL: Record<string, string> = {
  connected: "Đã kết nối",
  connecting: "Đang kết nối",
  reconnecting: "Đang kết nối lại",
  lost: "Mất kết nối",
};

const DOT_COLOR: Record<string, string> = {
  connected: "bg-success",
  connecting: "bg-warning",
  reconnecting: "bg-warning",
  lost: "bg-danger",
};

export function ConnectionIndicator({ state }: { state: "connected" | "connecting" | "reconnecting" | "lost" }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink-muted-48">
      <span className={cn("h-2 w-2 rounded-full", DOT_COLOR[state])} aria-hidden />
      {LABEL[state]}
    </span>
  );
}
