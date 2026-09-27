import { useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  fallbackErrorMessage,
  formatVnd,
  type PayoutRequest,
  type PayoutRequestStatus,
} from "@ticketbooking/shared";
import { TextField } from "@/components/text-field";
import { useUpdatePayoutRequestStatus } from "@/features/admin/hooks";

type PayoutAction = Extract<
  PayoutRequestStatus,
  "APPROVED" | "REJECTED" | "PAID" | "HOLD" | "PENDING"
>;

const ACTION_LABEL: Record<PayoutAction, string> = {
  APPROVED: "Duyệt yêu cầu",
  REJECTED: "Từ chối",
  PAID: "Đánh dấu đã chuyển khoản",
  HOLD: "Tạm giữ",
  PENDING: "Mở lại (bỏ tạm giữ)",
};

/** Bắt buộc nhập lý do khi từ chối hoặc tạm giữ — cần lưu vết cho các quyết định nhạy cảm về tiền. */
const REQUIRES_REASON: PayoutAction[] = ["REJECTED", "HOLD"];

export function PayoutActionDialog({
  request,
  action,
  trigger,
}: {
  request: PayoutRequest;
  action: PayoutAction;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const updateStatus = useUpdatePayoutRequestStatus();
  const reasonRequired = REQUIRES_REASON.includes(action);

  async function handleConfirm() {
    setError(null);
    try {
      await updateStatus.mutateAsync({
        requestId: request.id,
        body: { status: action, reason: reason || undefined },
      });
      setOpen(false);
      setReason("");
    } catch (err) {
      setError(fallbackErrorMessage(err));
    }
  }

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)}>{trigger}</TouchableOpacity>

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.title}>{ACTION_LABEL[action]}</Text>
            <Text style={styles.description}>
              {request.organizerEmail} · {formatVnd(request.amount)} ·{" "}
              {request.bankAccount.bankName} – {request.bankAccount.accountNumber} (
              {request.bankAccount.accountHolderName})
              {action === "PAID"
                ? " — xác nhận bạn đã tự chuyển khoản số tiền này ngoài hệ thống."
                : null}
              {action === "HOLD"
                ? " — chặn không cho yêu cầu này tiếp tục xử lý cho tới khi được mở lại."
                : null}
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {reasonRequired ? (
              <TextField
                label={`Lý do ${action === "HOLD" ? "tạm giữ" : "từ chối"} *`}
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
                style={styles.textarea}
              />
            ) : null}

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setOpen(false)}>
                <Text style={styles.secondaryButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  updateStatus.isPending || (reasonRequired && !reason.trim())
                    ? styles.disabled
                    : null,
                ]}
                disabled={updateStatus.isPending || (reasonRequired && !reason.trim())}
                onPress={handleConfirm}
              >
                {updateStatus.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Xác nhận</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  dialog: { width: "100%", backgroundColor: "#fff", borderRadius: 14, padding: 20, gap: 12 },
  title: { fontSize: 17, fontWeight: "700", color: "#1d1d1f" },
  description: { fontSize: 13, color: "#6b6b70" },
  error: { fontSize: 13, color: "#d92d20" },
  textarea: { height: 80, textAlignVertical: "top", paddingTop: 10 },
  actionsRow: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 4 },
  primaryButton: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  secondaryButton: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { fontSize: 13, fontWeight: "600", color: "#1d1d1f" },
  disabled: { opacity: 0.5 },
});
