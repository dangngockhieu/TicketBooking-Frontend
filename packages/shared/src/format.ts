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

/** 15/10 — dùng cho trục biểu đồ, nơi năm không cần thiết và cần ngắn gọn. */
export function formatShortDate(iso: string): string {
  return formatInTimeZone(iso, TIMEZONE, "dd/MM", { locale: vi });
}

/** 1,5tr / 25tr / 850k — dùng cho trục biểu đồ, nơi độ chính xác tuyệt đối không cần thiết. */
export function formatVndCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(amount / 1_000_000)}tr`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(amount / 1_000)}k`;
  }
  return new Intl.NumberFormat("vi-VN").format(amount);
}

/** "2026-09" — tháng hiện tại theo giờ Việt Nam, dùng làm giá trị mặc định của bộ chọn tháng. */
export function currentMonthKey(now: Date = new Date()): string {
  return formatInTimeZone(now, TIMEZONE, "yyyy-MM");
}

/** "2026-09" ± n tháng → "2026-08" / "2026-10". */
export function shiftMonthKey(key: string, delta: number): string {
  const [year, month] = key.split("-").map(Number);
  const index = (year ?? 0) * 12 + (month ?? 1) - 1 + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** "2026-09" → "Tháng 9/2026" */
export function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  return `Tháng ${Number(month)}/${year}`;
}

/** ("2026-09-01", "2026-09-07") → "01–07/09". Chuỗi ngày thuần, không qua múi giờ. */
export function formatWeekRange(start: string, end: string): string {
  return `${start.slice(8, 10)}–${end.slice(8, 10)}/${end.slice(5, 7)}`;
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
