import type { QueueClientEvent } from "@/features/queue/queue-client";

export type QueueViewState =
  | { status: "checking" }
  | { status: "connecting" }
  | {
      status: "waiting";
      position: number;
      totalWaiting: number;
      estimatedWaitSeconds: number;
      initialPosition: number;
    }
  | {
      status: "reconnecting";
      lastKnown: {
        position: number;
        totalWaiting: number;
        estimatedWaitSeconds: number;
        initialPosition: number;
      } | null;
    }
  | { status: "lost" }
  | { status: "admitted"; accessToken: string; expiresInSeconds: number };

export type QueueAction =
  | { type: "QUEUE_DISABLED" }
  | { type: "CLIENT_EVENT"; event: QueueClientEvent }
  | { type: "RETRY" };

export const initialQueueState: QueueViewState = { status: "checking" };

/**
 * State machine của /queue/[eventId] — giống hệt apps/web/src/features/queue/reducer.ts
 * (thuần logic, không phụ thuộc DOM). Xem docs/07-waiting-room.md §3.
 * checking -> connecting -> waiting <-> reconnecting -> lost | admitted
 */
export function queueReducer(state: QueueViewState, action: QueueAction): QueueViewState {
  switch (action.type) {
    case "QUEUE_DISABLED":
      return state; // caller điều hướng ra khỏi màn hình, state không còn quan trọng

    case "RETRY":
      return { status: "connecting" };

    case "CLIENT_EVENT": {
      const { event } = action;

      if (event.kind === "connection") {
        if (event.state === "connecting") return { status: "connecting" };
        if (event.state === "connected") {
          // Giữ nguyên waiting nếu đã có dữ liệu (reconnect thành công), không reset về connecting.
          if (state.status === "waiting") return state;
          if (state.status === "reconnecting" && state.lastKnown) {
            return { status: "waiting", ...state.lastKnown };
          }
          return { status: "connecting" };
        }
        if (event.state === "reconnecting") {
          if (state.status === "waiting") {
            return {
              status: "reconnecting",
              lastKnown: {
                position: state.position,
                totalWaiting: state.totalWaiting,
                estimatedWaitSeconds: state.estimatedWaitSeconds,
                initialPosition: state.initialPosition,
              },
            };
          }
          if (state.status === "reconnecting") return state;
          return { status: "reconnecting", lastKnown: null };
        }
        if (event.state === "closed") {
          if (state.status === "admitted") return state;
          return { status: "lost" };
        }
        return state;
      }

      // event.kind === "message"
      const message = event.message;
      if (message.type === "POSITION_UPDATE") {
        const initialPosition =
          state.status === "waiting"
            ? state.initialPosition
            : state.status === "reconnecting" && state.lastKnown
              ? state.lastKnown.initialPosition
              : message.position;
        return {
          status: "waiting",
          position: message.position,
          totalWaiting: message.totalWaiting,
          estimatedWaitSeconds: message.estimatedWaitSeconds,
          initialPosition,
        };
      }
      if (message.type === "ADMITTED") {
        return {
          status: "admitted",
          accessToken: message.accessToken,
          expiresInSeconds: message.expiresInSeconds,
        };
      }
      if (message.type === "REMOVED") {
        return { status: "lost" };
      }
      return state;
    }

    default:
      return state;
  }
}
