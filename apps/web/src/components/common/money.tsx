import { formatVnd } from "@ticketbooking/shared";

export function Money({ amount, className }: { amount: number; className?: string }) {
  return <span className={className}>{formatVnd(amount)}</span>;
}
