import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Giỏ vé tạm lưu theo eventId — sống qua login/phòng chờ. Khác web (sessionStorage,
 * đồng bộ): AsyncStorage là bất đồng bộ, nên mọi hàm ở đây trả về Promise — màn hình
 * gọi phải `await`, không dùng được trong lazy `useState` initializer như web.
 * Xem docs/06-booking-payment-flow.md §2.
 */
export type Cart = Record<string, number>; // ticketClassId -> quantity

function key(eventId: string) {
  return `cart:${eventId}`;
}

export async function loadCart(eventId: string): Promise<Cart> {
  try {
    const raw = await AsyncStorage.getItem(key(eventId));
    return raw ? (JSON.parse(raw) as Cart) : {};
  } catch {
    return {};
  }
}

export async function saveCart(eventId: string, cart: Cart): Promise<void> {
  try {
    await AsyncStorage.setItem(key(eventId), JSON.stringify(cart));
  } catch {
    // AsyncStorage không khả dụng — bỏ qua, không chặn UI
  }
}

export async function clearCart(eventId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key(eventId));
  } catch {
    // ignore
  }
}
