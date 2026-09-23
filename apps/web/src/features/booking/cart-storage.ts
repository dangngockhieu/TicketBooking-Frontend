/**
 * Giỏ vé tạm lưu sessionStorage theo eventId — sống qua login/phòng chờ.
 * Xem docs/06-booking-payment-flow.md §2.
 */
export type Cart = Record<string, number>; // ticketClassId -> quantity

function key(eventId: string) {
  return `cart:${eventId}`;
}

export function loadCart(eventId: string): Cart {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(key(eventId));
    return raw ? (JSON.parse(raw) as Cart) : {};
  } catch {
    return {};
  }
}

export function saveCart(eventId: string, cart: Cart) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key(eventId), JSON.stringify(cart));
  } catch {
    // sessionStorage không khả dụng (private mode…) — bỏ qua, không chặn UI
  }
}

export function clearCart(eventId: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key(eventId));
  } catch {
    // ignore
  }
}
