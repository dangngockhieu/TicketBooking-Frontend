import { ApiError } from "@/types/api";

/**
 * Backend không có mã lỗi số riêng — phân loại lỗi dựa trên (HTTP status, message).
 * Xem docs/05-api-contract.md §3 và docs/04-auth-flow.md §3.3b.
 * Message ở đây khớp NGUYÊN VĂN chuỗi tiếng Việt trong AuthServiceImpl/GlobalExceptionHandler
 * (repo backend) — nếu backend đổi câu chữ, cập nhật lại đây (nên có test snapshot).
 */

export type LoginErrorKind = "invalid-credentials" | "unverified" | "locked" | "unknown";

export function classifyLoginError(error: ApiError): LoginErrorKind {
  if (error.httpStatus !== 401) return "unknown";
  const msg = error.message.toLowerCase();
  if (msg.includes("email hoặc mật khẩu không chính xác")) return "invalid-credentials";
  if (msg.includes("xác thực") || msg.includes("kích hoạt") || msg.includes("chờ duyệt")) return "unverified";
  if (msg.includes("đã bị khóa")) return "locked";
  return "unknown";
}

export const LOGIN_ERROR_MESSAGES: Record<LoginErrorKind, string> = {
  "invalid-credentials": "Email hoặc mật khẩu không chính xác.",
  unverified: "Tài khoản chưa được xác thực email.",
  locked: "Tài khoản đã bị khóa. Vui lòng liên hệ ban quản trị.",
  unknown: "Tài khoản chưa thể đăng nhập. Vui lòng liên hệ hỗ trợ.",
};

/** Thông báo mặc định để hiển thị toast khi không có xử lý riêng cho màn hình đó. */
export function fallbackErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.httpStatus >= 500) return "Có lỗi xảy ra, vui lòng thử lại sau.";
    return error.message || "Có lỗi xảy ra, vui lòng thử lại.";
  }
  return "Có lỗi xảy ra, vui lòng thử lại.";
}

/** Lỗi 409 "Chỉ còn N vé." → tách số N để tự sửa lại số lượng trên UI. */
export function parseInsufficientQuantity(message: string): number | null {
  const match = message.match(/chỉ còn\s+(\d+)\s+vé/i);
  return match ? Number(match[1]) : null;
}
