import { formatVnd } from "@/lib/format";

export function Money({ amount, className }: { amount: number; className?: string }) {
  return <span className={className}>{formatVnd(amount)}</span>;
}
