/**
 * Bù lệch đồng hồ client/server. Mọi logic nghiệp vụ cần "bây giờ" (đếm ngược giữ chỗ,
 * đếm ngược mở bán...) PHẢI dùng serverTime.now(), không dùng Date.now() trực tiếp —
 * xem docs/07 (§3) và docs/CONVENTIONS.md. Giống hệt apps/web/src/lib/server-time.ts,
 * không tách sang packages/shared vì mỗi app tự giữ offset runtime riêng của nó.
 */
let offsetMs = 0;

export const serverTime = {
  /** Gọi mỗi khi nhận response có `responseTime` (epoch ms của server). */
  sync(responseTime: number) {
    offsetMs = responseTime - Date.now();
  },
  now(): number {
    return Date.now() + offsetMs;
  },
  reset() {
    offsetMs = 0;
  },
};
