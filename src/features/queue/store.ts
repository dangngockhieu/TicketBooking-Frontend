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

function storageKey(eventId: string) {
  return `queue-token:${eventId}`;
}

function readFromSession(eventId: string): QueueTokenEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(eventId));
    return raw ? (JSON.parse(raw) as QueueTokenEntry) : null;
  } catch {
    return null;
  }
}

function writeToSession(eventId: string, entry: QueueTokenEntry | null) {
  if (typeof window === "undefined") return;
  try {
    if (entry) window.sessionStorage.setItem(storageKey(eventId), JSON.stringify(entry));
    else window.sessionStorage.removeItem(storageKey(eventId));
  } catch {
    // sessionStorage không khả dụng — bỏ qua
  }
}

/**
 * Queue token theo eventId — sống qua F5 trong cùng tab qua sessionStorage,
 * không chia sẻ giữa các tab. Xem docs/07-waiting-room.md §4.
 */
export const useQueueStore = create<QueueState>((set, get) => ({
  tokens: {},
  set: (eventId, token, expiresInSeconds) => {
    const entry: QueueTokenEntry = { token, expiresAt: serverTime.now() + expiresInSeconds * 1000 };
    writeToSession(eventId, entry);
    set((state) => ({ tokens: { ...state.tokens, [eventId]: entry } }));
  },
  get: (eventId) => {
    const entry = get().tokens[eventId] ?? readFromSession(eventId);
    if (!entry) return null;
    if (entry.expiresAt <= serverTime.now()) {
      writeToSession(eventId, null);
      return null;
    }
    return entry.token;
  },
  clear: (eventId) => {
    writeToSession(eventId, null);
    set((state) => {
      const next = { ...state.tokens };
      delete next[eventId];
      return { tokens: next };
    });
  },
  clearAll: () => {
    const eventIds = Object.keys(get().tokens);
    for (const eventId of eventIds) writeToSession(eventId, null);
    set({ tokens: {} });
  },
}));
