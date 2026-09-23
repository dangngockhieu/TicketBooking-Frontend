"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { getAccessToken } from "@/features/auth/store";
import { useQueueStore } from "@/features/queue/store";
import { StompQueueClient, type QueueClient } from "@/features/queue/queue-client";
import { initialQueueState, queueReducer } from "@/features/queue/reducer";

/**
 * Kết nối phòng chờ ảo cho một eventId. Phát hiện tab khác đang chờ cùng sự
 * kiện qua BroadcastChannel để không mở 2 kết nối song song — xem
 * docs/07-waiting-room.md §4.
 */
export function useQueue(eventId: string) {
  const [state, dispatch] = useReducer(queueReducer, initialQueueState);
  const [otherTabWaiting, setOtherTabWaiting] = useState(false);
  const clientRef = useRef<QueueClient | null>(null);
  const setToken = useQueueStore((s) => s.set);

  useEffect(() => {
    const channel = new BroadcastChannel(`queue:${eventId}`);
    channel.postMessage("waiting");
    channel.onmessage = (e) => {
      if (e.data === "waiting") setOtherTabWaiting(true);
    };
    return () => channel.close();
  }, [eventId]);

  useEffect(() => {
    if (otherTabWaiting) return;

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
  }, [eventId, otherTabWaiting]);

  useEffect(() => {
    if (state.status === "admitted") {
      setToken(eventId, state.accessToken, state.expiresInSeconds);
      document.title = "🎟 Đến lượt bạn!";
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Đến lượt bạn!", { body: "Bạn có thể tiếp tục đặt vé ngay bây giờ." });
      }
    }
  }, [state, eventId, setToken]);

  // Hỏi xác nhận khi đang waiting và người dùng cố rời trang.
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (state.status === "waiting" || state.status === "reconnecting") {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state.status]);

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

  return { state, otherTabWaiting, leave, retry };
}
