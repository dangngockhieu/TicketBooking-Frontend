import { formatInTimeZone } from "date-fns-tz";
import { vi } from "date-fns/locale";

const TIMEZONE = "Asia/Ho_Chi_Minh";

/** 1.500.000 ₫ */
export function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** 19:00, Thứ Năm 15/10/2026 */
export function formatDateTime(iso: string): string {
  return formatInTimeZone(iso, TIMEZONE, "HH:mm, EEEE dd/MM/yyyy", { locale: vi });
}

/** 15/10/2026 */
export function formatDate(iso: string): string {
  return formatInTimeZone(iso, TIMEZONE, "dd/MM/yyyy", { locale: vi });
}

/** 19:00 */
export function formatTime(iso: string): string {
  return formatInTimeZone(iso, TIMEZONE, "HH:mm", { locale: vi });
}

/** mm:ss — dùng cho đồng hồ đếm ngược giữ chỗ */
export function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
