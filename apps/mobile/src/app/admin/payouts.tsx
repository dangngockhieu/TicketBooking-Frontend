import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PauseCircle } from "lucide-react-native";
import { formatDate, formatVnd } from "@ticketbooking/shared";
import { PayoutStatusBadge } from "@/components/payout-status-badge";
import { PayoutActionDialog } from "@/features/admin/components/payout-action-dialog";
import { useAllPayoutRequests } from "@/features/admin/hooks";
import type { PayoutRequestStatus } from "@ticketbooking/shared";

const TABS: { label: string; value: PayoutRequestStatus | undefined }[] = [
  { label: "Tất cả", value: undefined },
  { label: "Chờ duyệt", value: "PENDING" },
  { label: "Đã duyệt", value: "APPROVED" },
  { label: "Tạm giữ", value: "HOLD" },
  { label: "Đã chi trả", value: "PAID" },
  { label: "Đã từ chối", value: "REJECTED" },
];

export default function AdminPayoutsScreen() {
  const [status, setStatus] = useState<PayoutRequestStatus | undefined>("PENDING");
  const { data, isLoading, isError, refetch, isRefetching } = useAllPayoutRequests({
    status,
    page: 1,
    size: 50,
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(request) => request.id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={
          <FlatList
            data={TABS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(tab) => tab.label}
            contentContainerStyle={styles.tabsRow}
            style={styles.tabsList}
            renderItem={({ item }) => {
              const active = status === item.value;
              return (
                <TouchableOpacity
                  style={[styles.tab, active ? styles.tabActive : null]}
                  onPress={() => setStatus(item.value)}
                >
                  <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator />
            </View>
          ) : isError ? (
            <TouchableOpacity style={styles.center} onPress={() => refetch()}>
              <Text style={styles.meta}>Không thể tải. Nhấn để thử lại.</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.center}>
              <Text style={styles.meta}>Không có yêu cầu nào.</Text>
            </View>
          )
        }
        renderItem={({ item: request }) => (
          <View style={styles.card}>
            <Text style={styles.organizerEmail}>{request.organizerEmail}</Text>
            <Text style={styles.meta}>{formatDate(request.createdAt)}</Text>
            <Text style={styles.meta}>
              {request.source === "AUTO" ? "Tự động" : "Yêu cầu"}
              {request.eventTitle ? ` · ${request.eventTitle}` : ""}
            </Text>
            <Text style={styles.amount}>{formatVnd(request.amount)}</Text>
            <Text style={styles.meta}>
              {request.bankAccount.bankName} · {request.bankAccount.accountNumber} (
              {request.bankAccount.accountHolderName})
            </Text>

            <View style={styles.statusRow}>
              <PayoutStatusBadge status={request.status} />
            </View>
            {(request.status === "HOLD" || request.status === "REJECTED") && request.reason ? (
              <Text style={styles.reasonText}>{request.reason}</Text>
            ) : null}

            <View style={styles.actionsRow}>
              {request.status === "PENDING" ? (
                <>
                  <PayoutActionDialog
                    request={request}
                    action="APPROVED"
                    trigger={
                      <View style={styles.secondaryButton}>
                        <Text style={styles.secondaryButtonText}>Duyệt</Text>
                      </View>
                    }
                  />
                  <PayoutActionDialog
                    request={request}
                    action="REJECTED"
                    trigger={
                      <View style={styles.dangerButton}>
                        <Text style={styles.dangerButtonText}>Từ chối</Text>
                      </View>
                    }
                  />
                </>
              ) : null}
              {request.status === "APPROVED" ? (
                <PayoutActionDialog
                  request={request}
                  action="PAID"
                  trigger={
                    <View style={styles.primaryButton}>
                      <Text style={styles.primaryButtonText}>Đã chuyển khoản</Text>
                    </View>
                  }
                />
              ) : null}
              {request.status === "HOLD" ? (
                <PayoutActionDialog
                  request={request}
                  action="PENDING"
                  trigger={
                    <View style={styles.secondaryButton}>
                      <Text style={styles.secondaryButtonText}>Mở lại</Text>
                    </View>
                  }
                />
              ) : request.status !== "PAID" && request.status !== "REJECTED" ? (
                <PayoutActionDialog
                  request={request}
                  action="HOLD"
                  trigger={
                    <View style={styles.holdButton}>
                      <PauseCircle size={14} color="#b42318" />
                      <Text style={styles.holdButtonText}>Tạm giữ</Text>
                    </View>
                  }
                />
              ) : null}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 48 },
  list: { padding: 16 },
  meta: { fontSize: 13, color: "#6b6b70" },
  tabsList: { marginBottom: 12 },
  tabsRow: { gap: 8, paddingBottom: 4 },
  tab: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  tabText: { fontSize: 13, fontWeight: "500", color: "#1d1d1f" },
  tabTextActive: { color: "#fff" },
  card: {
    gap: 4,
    borderWidth: 1,
    borderColor: "#e5e5ea",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  organizerEmail: { fontSize: 14, fontWeight: "600", color: "#1d1d1f" },
  amount: { fontSize: 16, fontWeight: "700", color: "#1d1d1f", marginTop: 2 },
  reasonText: { fontSize: 12, color: "#d92d20" },
  statusRow: { marginTop: 4 },
  actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  primaryButton: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  secondaryButton: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { fontSize: 12, fontWeight: "600", color: "#1d1d1f" },
  dangerButton: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#fde2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButtonText: { fontSize: 12, fontWeight: "600", color: "#b42318" },
  holdButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d1d6",
  },
  holdButtonText: { fontSize: 12, fontWeight: "600", color: "#b42318" },
});
