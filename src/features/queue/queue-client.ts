import { Client, type IMessage } from "@stomp/stompjs";
import { env } from "@/lib/env";
import type { QueueMessage } from "@/types/api";

export type QueueClientEvent =
  | { kind: "connection"; state: "connecting" | "connected" | "reconnecting" | "closed" }
  | { kind: "message"; message: QueueMessage };

/**
 * Giao thức STOMP đề xuất — xem docs/07-waiting-room.md §1–2.
 * Bọc transport trong interface này để đổi cách kết nối không ảnh hưởng UI.
 */
export interface QueueClient {
  connect(opts: { eventId: string; getAccessToken: () => string | null }): void;
  leave(): void;
  disconnect(): void;
  on(listener: (e: QueueClientEvent) => void): () => void;
}

const HEARTBEAT_INTERVAL_MS = 10_000;
const RECONNECT_DELAYS_MS = [1000, 2000, 4000]; // backoff 1s → 2s → 4s, tối đa 3 lần

export class StompQueueClient implements QueueClient {
  private client: Client | null = null;
  private listeners = new Set<(e: QueueClientEvent) => void>();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempt = 0;
  private eventId: string | null = null;
  private getAccessToken: (() => string | null) | null = null;
  private manuallyDisconnected = false;

  connect(opts: { eventId: string; getAccessToken: () => string | null }): void {
    this.eventId = opts.eventId;
    this.getAccessToken = opts.getAccessToken;
    this.manuallyDisconnected = false;
    this.reconnectAttempt = 0;
    this.openSocket();
  }

  private openSocket() {
    if (!this.eventId || !this.getAccessToken) return;
    this.emit({
      kind: "connection",
      state: this.reconnectAttempt > 0 ? "reconnecting" : "connecting",
    });

    const token = this.getAccessToken();
    this.client = new Client({
      brokerURL: env.NEXT_PUBLIC_WS_URL,
      connectHeaders: {
        Authorization: token ? `Bearer ${token}` : "",
        eventId: this.eventId,
      },
      heartbeatIncoming: HEARTBEAT_INTERVAL_MS,
      heartbeatOutgoing: HEARTBEAT_INTERVAL_MS,
      reconnectDelay: 0, // reconnect thủ công theo backoff riêng, không dùng auto-reconnect của thư viện
      onConnect: () => {
        this.reconnectAttempt = 0;
        this.emit({ kind: "connection", state: "connected" });
        this.client?.subscribe("/user/queue/position", (message: IMessage) => {
          try {
            const payload = JSON.parse(message.body) as QueueMessage;
            this.emit({ kind: "message", message: payload });
          } catch {
            // payload không hợp lệ — bỏ qua
          }
        });
        this.startHeartbeat();
      },
      onStompError: () => this.handleDrop(),
      onWebSocketClose: () => this.handleDrop(),
    });
    this.client.activate();
  }

  private handleDrop() {
    this.stopHeartbeat();
    if (this.manuallyDisconnected) {
      this.emit({ kind: "connection", state: "closed" });
      return;
    }
    if (this.reconnectAttempt >= RECONNECT_DELAYS_MS.length) {
      this.emit({ kind: "connection", state: "closed" });
      return;
    }
    const delay = RECONNECT_DELAYS_MS[this.reconnectAttempt];
    this.reconnectAttempt += 1;
    this.emit({ kind: "connection", state: "reconnecting" });
    setTimeout(() => {
      if (!this.manuallyDisconnected) this.openSocket();
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.eventId) {
        this.client?.publish({
          destination: "/app/queue.heartbeat",
          body: JSON.stringify({ eventId: this.eventId }),
        });
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  leave(): void {
    if (this.eventId && this.client?.connected) {
      this.client.publish({
        destination: "/app/queue.leave",
        body: JSON.stringify({ eventId: this.eventId }),
      });
    }
    this.disconnect();
  }

  disconnect(): void {
    this.manuallyDisconnected = true;
    this.stopHeartbeat();
    this.client?.deactivate();
    this.client = null;
    this.emit({ kind: "connection", state: "closed" });
  }

  on(listener: (e: QueueClientEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: QueueClientEvent) {
    for (const listener of this.listeners) listener(event);
  }
}
