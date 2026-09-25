import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Minus, Plus } from "lucide-react-native";
import {
  ApiError,
  fallbackErrorMessage,
  formatVnd,
  parseInsufficientQuantity,
  type EventDetail,
  type SaleState,
} from "@ticketbooking/shared";
import { useAvailability } from "@/features/events/hooks";
import { useAuthStore } from "@/lib/store";
import { useCreateBooking } from "@/features/booking/hooks";
import { loadCart, saveCart, type Cart } from "@/features/booking/cart-storage";
import { useQueueStore } from "@/features/queue/store";
import { queueApi } from "@/lib/api";

const MAX_PER_CLASS = 10;
const MAX_TOTAL = 10;

const SALE_STATE_LABEL: Record<SaleState, string | null> = {
  NOT_STARTED: "Chưa mở bán",
  ON_SALE: null,
  ENDED: "Đã đóng bán",
  SOLD_OUT: "Hết vé",
};

export function TicketSelector({ event }: { event: EventDetail }) {
  const status = useAuthStore((s) => s.status);
  const { data: availability } = useAvailability(event.id);
  const createBooking = useCreateBooking();
  const getQueueToken = useQueueStore((s) => s.get);
  const clearQueueToken = useQueueStore((s) => s.clear);

  const [cart, setCart] = useState<Cart>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadCart(event.id).then((c) => {
      if (!cancelled) setCart(c);
    });
    return () => {
      cancelled = true;
    };
  }, [event.id]);

  useEffect(() => {
    saveCart(event.id, cart);
  }, [event.id, cart]);

  const availableByClass = useMemo(() => {
    const map = new Map<string, number>();
    for (const tc of availability?.ticketClasses ?? event.ticketClasses) {
      map.set(tc.id, tc.availableQuantity);
    }
    return map;
  }, [availability, event.ticketClasses]);

  const saleState = availability?.saleState ?? event.saleState;
  const totalQuantity = Object.values(cart).reduce((sum, q) => sum + q, 0);
  const totalAmount = event.ticketClasses.reduce(
    (sum, tc) => sum + (cart[tc.id] ?? 0) * tc.price,
    0,
  );

  function updateQuantity(ticketClassId: string, delta: number) {
    setCart((prev) => {
      const available = availableByClass.get(ticketClassId) ?? 0;
      const current = prev[ticketClassId] ?? 0;
      const maxAllowed = Math.min(available, MAX_PER_CLASS, MAX_TOTAL - totalQuantity + current);
      const next = Math.max(0, Math.min(current + delta, maxAllowed));
      return { ...prev, [ticketClassId]: next };
    });
  }

  async function handleBuy() {
    setError(null);
    if (status !== "authenticated") {
      router.push({ pathname: "/login", params: { email: "" } });
      return;
    }

    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([ticketClassId, quantity]) => ({ ticketClassId, quantity }));
    if (items.length === 0) return;

    try {
      const queueToken = getQueueToken(event.id);
      if (!queueToken) {
        const queueStatus = await queueApi.getStatus(event.id);
        if (queueStatus.queueEnabled) {
          router.push({ pathname: "/queue/[eventId]", params: { eventId: event.id } } as never);
          return;
        }
      }

      const booking = await createBooking.mutateAsync({
        body: { eventId: event.id, items },
        queueToken,
      });
      router.push({
        pathname: "/checkout/[bookingId]",
        params: { bookingId: booking.id },
      } as never);
    } catch (err) {
      if (err instanceof ApiError) {
        const n = parseInsufficientQuantity(err.message);
        if (n !== null) {
          setError(err.message);
          return;
        }
        if (err.httpStatus === 403 && err.message.toLowerCase().includes("token phòng chờ")) {
          clearQueueToken(event.id);
          setError("Phiên phòng chờ đã hết hạn, vui lòng xếp hàng lại.");
          router.push({ pathname: "/queue/[eventId]", params: { eventId: event.id } } as never);
          return;
        }
        if (err.httpStatus === 409) {
          setError(err.message || "Hạng vé này đã hết vé.");
          return;
        }
      }
      setError(fallbackErrorMessage(err));
    }
  }

  const disabledLabel = SALE_STATE_LABEL[saleState];
  const canBuy = saleState === "ON_SALE" && totalQuantity > 0 && !createBooking.isPending;

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Chọn vé</Text>

      <View style={styles.list}>
        {event.ticketClasses.map((tc) => {
          const available = availableByClass.get(tc.id) ?? 0;
          const qty = cart[tc.id] ?? 0;
          const soldOut = available <= 0;
          return (
            <View key={tc.id} style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>{tc.name}</Text>
                <Text style={styles.rowMeta}>
                  {formatVnd(tc.price)} · {soldOut ? "Hết vé" : `Còn ${available}`}
                </Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={[styles.stepButton, qty === 0 ? styles.stepButtonDisabled : null]}
                  disabled={qty === 0}
                  onPress={() => updateQuantity(tc.id, -1)}
                >
                  <Minus size={16} color={qty === 0 ? "#c7c7cc" : "#1d1d1f"} />
                </TouchableOpacity>
                <Text style={styles.qty}>{qty}</Text>
                <TouchableOpacity
                  style={[
                    styles.stepButton,
                    soldOut || qty >= available || totalQuantity >= MAX_TOTAL
                      ? styles.stepButtonDisabled
                      : null,
                  ]}
                  disabled={soldOut || qty >= available || totalQuantity >= MAX_TOTAL}
                  onPress={() => updateQuantity(tc.id, 1)}
                >
                  <Plus
                    size={16}
                    color={
                      soldOut || qty >= available || totalQuantity >= MAX_TOTAL
                        ? "#c7c7cc"
                        : "#1d1d1f"
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Tổng</Text>
        <Text style={styles.totalValue}>{formatVnd(totalAmount)}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.buyButton, !canBuy ? styles.buyButtonDisabled : null]}
        disabled={!canBuy}
        onPress={handleBuy}
      >
        <Text style={styles.buyButtonText}>
          {disabledLabel ?? (createBooking.isPending ? "Đang xử lý…" : "Mua vé")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#e5e5ea",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  heading: { fontSize: 16, fontWeight: "600", color: "#1d1d1f" },
  list: { gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderWidth: 1,
    borderColor: "#e5e5ea",
    borderRadius: 10,
    padding: 12,
  },
  rowInfo: { flex: 1, gap: 2 },
  rowName: { fontSize: 15, fontWeight: "500", color: "#1d1d1f" },
  rowMeta: { fontSize: 13, color: "#6b6b70" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    alignItems: "center",
    justifyContent: "center",
  },
  stepButtonDisabled: { opacity: 0.4 },
  qty: { width: 20, textAlign: "center", fontSize: 15, fontWeight: "600", color: "#1d1d1f" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e5ea",
    paddingTop: 12,
  },
  totalLabel: { fontSize: 16, fontWeight: "600", color: "#1d1d1f" },
  totalValue: { fontSize: 16, fontWeight: "700", color: "#1d1d1f" },
  error: { fontSize: 13, color: "#d92d20" },
  buyButton: {
    height: 50,
    borderRadius: 10,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
  },
  buyButtonDisabled: { opacity: 0.5 },
  buyButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
