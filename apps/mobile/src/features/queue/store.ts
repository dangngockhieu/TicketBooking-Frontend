import { create } from "zustand";
import { serverTime } from "@/lib/server-time";

interface QueueTokenEntry {
  token: string;
  expiresAt: number; // epoch ms
}

interface QueueState {
  tokens: Record<string, QueueTokenEntry>;
  set(eventId: string, token: string, expiresInSeconds: number): void;
  get(eventId: string): string | null;
  clear(eventId: string): void;
  /** Xóa toàn bộ queue token — dùng lúc đăng xuất. Xem docs/04-auth-flow.md §3.6. */
  clearAll(): void;
}

/**
 * Queue token theo eventId — chỉ in-memory (không có sessionStorage/nhiều tab
 * như web, chỉ 1 instance app đang chạy). Mất khi tắt hẳn app, chấp nhận được
 * vì thời hạn token vốn ngắn. Xem docs/07-waiting-room.md §4.
 */
export const useQueueStore = create<QueueState>((set, get) => ({
  tokens: {},
  set: (eventId, token, expiresInSeconds) => {
    const entry: QueueTokenEntry = { token, expiresAt: serverTime.now() + expiresInSeconds * 1000 };
    set((state) => ({ tokens: { ...state.tokens, [eventId]: entry } }));
  },
  get: (eventId) => {
    const entry = get().tokens[eventId];
    if (!entry) return null;
    if (entry.expiresAt <= serverTime.now()) {
      set((state) => {
        const next = { ...state.tokens };
        delete next[eventId];
        return { tokens: next };
      });
      return null;
    }
    return entry.token;
  },
  clear: (eventId) => {
    set((state) => {
      const next = { ...state.tokens };
      delete next[eventId];
      return { tokens: next };
    });
  },
  clearAll: () => set({ tokens: {} }),
}));
