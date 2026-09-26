import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { formatDate, formatVnd } from "@ticketbooking/shared";
import { PayoutStatusBadge } from "@/components/payout-status-badge";
import { RequestPayoutDialog } from "@/features/organizer/components/request-payout-dialog";
import { useMyPayoutRequests, useWallet } from "@/features/organizer/hooks";

export default function OrganizerWalletScreen() {
  const {
    data: wallet,
    isLoading: isWalletLoading,
    isError: isWalletError,
    refetch: refetchWallet,
  } = useWallet();
  const {
    data: requests,
    isLoading: isRequestsLoading,
    isError: isRequestsError,
    refetch: refetchRequests,
  } = useMyPayoutRequests({ page: 1, size: 20 });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Ví của tôi</Text>
      <Text style={styles.description}>
        Tiền tự động về trong 7 ngày sau khi sự kiện kết thúc. Cần gấp hơn? Gửi yêu cầu rút sớm bên
        dưới.
      </Text>

      {isWalletLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : isWalletError || !wallet ? (
        <TouchableOpacity style={styles.center} onPress={() => refetchWallet()}>
          <Text style={styles.meta}>Không thể tải. Nhấn để thử lại.</Text>
        </TouchableOpacity>
      ) : (
        <>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiTile}>
              <Text style={styles.kpiLabel}>Số dư khả dụng</Text>
              <Text style={styles.kpiValue}>{formatVnd(wallet.availableBalance)}</Text>
            </View>
            <View style={styles.kpiTile}>
              <Text style={styles.kpiLabel}>Đang chờ xử lý</Text>
              <Text style={styles.kpiValue}>{formatVnd(wallet.pendingPayout)}</Text>
            </View>
            <View style={styles.kpiTile}>
              <Text style={styles.kpiLabel}>Đã rút từ trước</Text>
              <Text style={styles.kpiValue}>{formatVnd(wallet.totalWithdrawn)}</Text>
            </View>
          </View>

          <RequestPayoutDialog availableBalance={wallet.availableBalance} />
        </>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lịch sử yêu cầu rút tiền</Text>
        {isRequestsLoading ? (
          <ActivityIndicator />
        ) : isRequestsError ? (
          <TouchableOpacity onPress={() => refetchRequests()}>
            <Text style={styles.meta}>Không thể tải. Nhấn để thử lại.</Text>
          </TouchableOpacity>
        ) : requests && requests.items.length > 0 ? (
          requests.items.map((request) => (
            <View key={request.id} style={styles.requestRow}>
              <View style={styles.requestInfo}>
                <Text style={styles.requestSource}>
                  {request.source === "AUTO" ? "Tự động" : "Yêu cầu sớm"}
                </Text>
                {request.eventTitle ? (
                  <Text style={styles.meta} numberOfLines={1}>
                    {request.eventTitle}
                  </Text>
                ) : null}
                <Text style={styles.meta}>{formatDate(request.createdAt)}</Text>
                <Text style={styles.meta}>
                  {request.bankAccount.bankName} · {request.bankAccount.accountNumber}
                </Text>
                {(request.status === "REJECTED" || request.status === "HOLD") && request.reason ? (
                  <Text style={styles.reasonText}>{request.reason}</Text>
                ) : null}
              </View>
              <View style={styles.requestRight}>
                <Text style={styles.requestAmount}>{formatVnd(request.amount)}</Text>
                <PayoutStatusBadge status={request.status} />
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.meta}>Chưa có yêu cầu rút tiền nào.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 24 },
  title: { fontSize: 22, fontWeight: "700", color: "#1d1d1f" },
  description: { fontSize: 13, color: "#6b6b70" },
  meta: { fontSize: 13, color: "#6b6b70" },
  kpiGrid: { flexDirection: "row", gap: 10 },
  kpiTile: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e5ea",
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  kpiLabel: { fontSize: 11, color: "#6b6b70" },
  kpiValue: { fontSize: 15, fontWeight: "700", color: "#1d1d1f" },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#1d1d1f" },
  requestRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e5e5ea",
    borderRadius: 10,
    padding: 12,
  },
  requestInfo: { flex: 1, gap: 2 },
  requestSource: { fontSize: 14, fontWeight: "600", color: "#1d1d1f" },
  reasonText: { fontSize: 12, color: "#d92d20", marginTop: 2 },
  requestRight: { alignItems: "flex-end", gap: 6 },
  requestAmount: { fontSize: 14, fontWeight: "700", color: "#1d1d1f" },
});
