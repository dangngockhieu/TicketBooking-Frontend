"use client";
import {
  ApiError,
  EventDetail,
  SaleState,
  fallbackErrorMessage,
  parseInsufficientQuantity,
} from "@ticketbooking/shared";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/common/money";
import { useAvailability } from "@/features/events/hooks";
import { useAuthStore } from "@/features/auth/store";
import { useCreateBooking } from "@/features/booking/hooks";
import { loadCart, saveCart } from "@/features/booking/cart-storage";
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
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const { data: availability } = useAvailability(event.id);
  const createBooking = useCreateBooking();
  const getQueueToken = useQueueStore((s) => s.get);
  const clearQueueToken = useQueueStore((s) => s.clear);

  const [cart, setCart] = useState(() => loadCart(event.id));

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
    if (status !== "authenticated") {
      router.push(`/login?next=/events/${event.id}`);
      return;
    }

    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([ticketClassId, quantity]) => ({ ticketClassId, quantity }));
    if (items.length === 0) return;

    try {
      // Đã có queue token còn hạn (vừa ADMITTED) → bỏ qua phòng chờ.
      const queueToken = getQueueToken(event.id);
      if (!queueToken) {
        const queueStatus = await queueApi.getStatus(event.id);
        if (queueStatus.queueEnabled) {
          router.push(`/queue/${event.id}`);
          return;
        }
      }

      const booking = await createBooking.mutateAsync({
        body: { eventId: event.id, items },
        queueToken,
      });
      router.push(`/checkout/${booking.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        const n = parseInsufficientQuantity(err.message);
        if (n !== null) {
          toast.error(err.message);
          return;
        }
        // Queue token sai/hết hạn → xóa và quay lại phòng chờ. Xem docs/05 §3.3.
        if (err.httpStatus === 403 && err.message.toLowerCase().includes("token phòng chờ")) {
          clearQueueToken(event.id);
          toast.error("Phiên phòng chờ đã hết hạn, vui lòng xếp hàng lại.");
          router.push(`/queue/${event.id}`);
          return;
        }
        if (err.httpStatus === 409) {
          toast.error(err.message || "Hạng vé này đã hết vé.");
          return;
        }
      }
      toast.error(fallbackErrorMessage(err));
    }
  }

  const disabledLabel = SALE_STATE_LABEL[saleState];
  const canBuy = saleState === "ON_SALE" && totalQuantity > 0 && !createBooking.isPending;

  return (
    <Card className="sticky top-24">
      <CardContent className="flex flex-col gap-4 p-6">
        <h2 className="text-lg font-semibold text-ink">Chọn vé</h2>

        <div className="flex flex-col gap-3">
          {event.ticketClasses.map((tc) => {
            const available = availableByClass.get(tc.id) ?? 0;
            const qty = cart[tc.id] ?? 0;
            const soldOut = available <= 0;
            return (
              <div
                key={tc.id}
                className="flex items-center justify-between gap-3 rounded-md border border-hairline p-3"
              >
                <div>
                  <p className="font-medium text-ink">{tc.name}</p>
                  <p className="text-sm text-ink-muted-48">
                    <Money amount={tc.price} /> · {soldOut ? "Hết vé" : `Còn ${available}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Giảm số lượng ${tc.name}`}
                    disabled={qty === 0}
                    onClick={() => updateQuantity(tc.id, -1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline disabled:opacity-30"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-5 text-center tabular-nums">{qty}</span>
                  <button
                    type="button"
                    aria-label={`Tăng số lượng ${tc.name}`}
                    disabled={soldOut || qty >= available || totalQuantity >= MAX_TOTAL}
                    onClick={() => updateQuantity(tc.id, 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline disabled:opacity-30"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-hairline pt-4 text-base font-semibold text-ink">
          <span>Tổng</span>
          <Money amount={totalAmount} />
        </div>

        <Button size="lg" disabled={!canBuy} onClick={handleBuy}>
          {disabledLabel ?? (createBooking.isPending ? "Đang xử lý…" : "Mua vé")}
        </Button>
      </CardContent>
    </Card>
  );
}
