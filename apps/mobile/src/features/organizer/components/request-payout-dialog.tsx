import { useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ApiError, fallbackErrorMessage, formatVnd } from "@ticketbooking/shared";
import { TextField } from "@/components/text-field";
import { useCreatePayoutRequest } from "@/features/organizer/hooks";

export function RequestPayoutDialog({ availableBalance }: { availableBalance: number }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createPayout = useCreatePayoutRequest();

  function reset() {
    setAmount("");
    setBankName("");
    setAccountNumber("");
    setAccountHolderName("");
    setError(null);
  }

  async function handleSubmit() {
    setError(null);
    try {
      await createPayout.mutateAsync({
        amount: Number(amount),
        bankAccount: { bankName, accountNumber, accountHolderName },
      });
      setOpen(false);
      reset();
    } catch (err) {
      if (err instanceof ApiError && (err.httpStatus === 409 || err.httpStatus === 400)) {
        setError(err.message);
        return;
      }
      setError(fallbackErrorMessage(err));
    }
  }

  const canSubmit =
    amount.trim() !== "" &&
    bankName.trim() !== "" &&
    accountNumber.trim() !== "" &&
    accountHolderName.trim() !== "";

  return (
    <>
      <TouchableOpacity
        style={[styles.triggerButton, availableBalance <= 0 ? styles.disabled : null]}
        disabled={availableBalance <= 0}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.triggerButtonText}>Yêu cầu rút tiền</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setOpen(false);
          reset();
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.title}>Yêu cầu rút tiền</Text>
            <Text style={styles.description}>
              Số dư khả dụng: {formatVnd(availableBalance)}. Admin sẽ duyệt và chuyển khoản thủ
              công.
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TextField
              label="Số tiền muốn rút (VNĐ)"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <TextField label="Ngân hàng" value={bankName} onChangeText={setBankName} />
            <TextField label="Số tài khoản" value={accountNumber} onChangeText={setAccountNumber} />
            <TextField
              label="Tên chủ tài khoản"
              value={accountHolderName}
              onChangeText={setAccountHolderName}
            />

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setOpen(false);
                  reset();
                }}
              >
                <Text style={styles.secondaryButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  !canSubmit || createPayout.isPending ? styles.disabled : null,
                ]}
                disabled={!canSubmit || createPayout.isPending}
                onPress={handleSubmit}
              >
                {createPayout.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Gửi yêu cầu</Text>
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
  triggerButton: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
  },
  triggerButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  disabled: { opacity: 0.5 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#1d1d1f" },
  description: { fontSize: 13, color: "#6b6b70" },
  error: { fontSize: 13, color: "#d92d20" },
  actionsRow: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 8 },
  primaryButton: {
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  secondaryButton: {
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { fontSize: 14, fontWeight: "600", color: "#1d1d1f" },
});
