import { useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { fallbackErrorMessage, type AccountSummary } from "@ticketbooking/shared";
import { TextField } from "@/components/text-field";
import { useUpdateAccountStatus } from "@/features/admin/hooks";

export function AccountStatusDialog({ account }: { account: AccountSummary }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const updateStatus = useUpdateAccountStatus();
  const nextStatus = account.status === "LOCKED" ? "ACTIVE" : "LOCKED";
  const isLocking = nextStatus === "LOCKED";

  async function handleConfirm() {
    setError(null);
    try {
      await updateStatus.mutateAsync({
        accountId: account.id,
        body: { status: nextStatus, reason: reason || undefined },
      });
      setOpen(false);
      setReason("");
    } catch (err) {
      setError(fallbackErrorMessage(err));
    }
  }

  return (
    <>
      <TouchableOpacity
        style={isLocking ? styles.dangerButton : styles.secondaryButton}
        onPress={() => setOpen(true)}
      >
        <Text style={isLocking ? styles.dangerButtonText : styles.secondaryButtonText}>
          {isLocking ? "Khóa" : "Mở khóa"}
        </Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.title}>{isLocking ? "Khóa tài khoản" : "Mở khóa tài khoản"}</Text>
            <Text style={styles.description}>{account.email}</Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {isLocking ? (
              <TextField
                label="Lý do *"
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
                  updateStatus.isPending || (isLocking && !reason.trim()) ? styles.disabled : null,
                ]}
                disabled={updateStatus.isPending || (isLocking && !reason.trim())}
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
  dangerButton: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#fde2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButtonText: { fontSize: 13, fontWeight: "600", color: "#b42318" },
  disabled: { opacity: 0.5 },
});
