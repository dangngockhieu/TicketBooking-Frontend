import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { queueApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { useQueueStore } from "@/features/queue/store";
import { useQueue } from "@/features/queue/use-queue";
import { QueuePosition } from "@/features/queue/components/queue-position";
import { ConnectionIndicator } from "@/features/queue/components/connection-indicator";

/**
 * Không có "otherTabWaiting" như web — chỉ 1 instance app đang chạy, xem
 * apps/mobile/src/features/queue/use-queue.ts.
 */
export default function QueueScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const existingToken = useQueueStore((s) => s.get(eventId));

  const { data: status, isLoading } = useQuery({
    queryKey: qk.queueStatus(eventId),
    queryFn: () => queueApi.getStatus(eventId),
    enabled: !existingToken,
  });

  const skipQueue = !!existingToken || (status && !status.queueEnabled);

  useEffect(() => {
    if (skipQueue) {
      router.replace({ pathname: "/events/[eventId]", params: { eventId } });
    }
  }, [skipQueue, eventId]);

  const { state, leave, retry } = useQueue(skipQueue ? "" : eventId);

  if (isLoading && !existingToken) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  if (skipQueue) return null;

  if (state.status === "admitted") {
    router.replace({ pathname: "/events/[eventId]", params: { eventId } });
    return <Center title="Đến lượt bạn!" description="Đang chuyển hướng…" />;
  }

  if (state.status === "lost") {
    return (
      <Center
        title="Bạn đã rời khỏi hàng chờ"
        description="Kết nối bị gián đoạn quá lâu."
        action={
          <TouchableOpacity style={styles.retryButton} onPress={retry}>
            <Text style={styles.retryButtonText}>Vào lại hàng chờ</Text>
          </TouchableOpacity>
        }
      />
    );
  }

  if (state.status === "checking" || state.status === "connecting") {
    return <Center title="Đang kết nối tới phòng chờ…" />;
  }

  const waitingData = state.status === "waiting" ? state : state.lastKnown;
  const connectionState = state.status === "waiting" ? "connected" : "reconnecting";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đang xếp hàng chờ</Text>

      {waitingData ? (
        <QueuePosition
          position={waitingData.position}
          totalWaiting={waitingData.totalWaiting}
          estimatedWaitSeconds={waitingData.estimatedWaitSeconds}
          initialPosition={waitingData.initialPosition}
        />
      ) : (
        <ActivityIndicator />
      )}

      <Text style={styles.notice}>Không thoát ứng dụng — bạn sẽ mất chỗ.</Text>

      <ConnectionIndicator state={connectionState} />

      <TouchableOpacity style={styles.leaveButton} onPress={leave}>
        <Text style={styles.leaveButtonText}>Rời hàng chờ</Text>
      </TouchableOpacity>
    </View>
  );
}

function Center({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 20,
  },
  center: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: "700", color: "#1d1d1f", textAlign: "center" },
  description: { fontSize: 14, color: "#6b6b70", textAlign: "center" },
  notice: { fontSize: 13, color: "#6b6b70", textAlign: "center" },
  retryButton: {
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  leaveButton: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    alignItems: "center",
    justifyContent: "center",
  },
  leaveButtonText: { fontSize: 14, fontWeight: "600", color: "#1d1d1f" },
});
