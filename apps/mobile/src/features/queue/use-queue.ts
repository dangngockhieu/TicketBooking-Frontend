import { useEffect, useReducer, useRef } from "react";
import { getAccessToken } from "@/lib/store";
import { useQueueStore } from "@/features/queue/store";
import { StompQueueClient, type QueueClient } from "@/features/queue/queue-client";
import { initialQueueState, queueReducer } from "@/features/queue/reducer";

/**
 * Kết nối phòng chờ ảo cho một eventId. Khác web: không có khái niệm "tab khác
 * đang chờ cùng sự kiện" (BroadcastChannel) vì chỉ 1 instance app chạy; cũng
 * không có document.title/Notification/beforeunload (API trình duyệt, không
 * tồn tại trên React Native) — xem docs/07-waiting-room.md §4.
 */
export function useQueue(eventId: string) {
  const [state, dispatch] = useReducer(queueReducer, initialQueueState);
  const clientRef = useRef<QueueClient | null>(null);
  const setToken = useQueueStore((s) => s.set);

  useEffect(() => {
    const client = new StompQueueClient();
    clientRef.current = client;

    const unsubscribe = client.on((event) => {
      dispatch({ type: "CLIENT_EVENT", event });
    });

    client.connect({ eventId, getAccessToken });

    return () => {
      unsubscribe();
      client.disconnect();
      clientRef.current = null;
    };
  }, [eventId]);

  useEffect(() => {
    if (state.status === "admitted") {
      setToken(eventId, state.accessToken, state.expiresInSeconds);
    }
  }, [state, eventId, setToken]);

  function leave() {
    clientRef.current?.leave();
  }

  function retry() {
    dispatch({ type: "RETRY" });
    clientRef.current?.disconnect();
    const client = new StompQueueClient();
    clientRef.current = client;
    client.on((event) => dispatch({ type: "CLIENT_EVENT", event }));
    client.connect({ eventId, getAccessToken });
  }

  return { state, leave, retry };
}
