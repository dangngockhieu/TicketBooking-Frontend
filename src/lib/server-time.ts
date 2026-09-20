/**
 * Bù lệch đồng hồ client/server. Mọi logic nghiệp vụ cần "bây giờ" (đếm ngược giữ chỗ,
 * đếm ngược mở bán...) PHẢI dùng serverTime.now(), không dùng Date.now() trực tiếp —
 * xem docs/07 (§3) và docs/CONVENTIONS.md.
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
  /** Dùng cho test / fake-api để reset lệch đồng hồ. */
  reset() {
    offsetMs = 0;
  },
};
