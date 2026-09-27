import { useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { fallbackErrorMessage, type EventDetail } from "@ticketbooking/shared";
import { TextField } from "@/components/text-field";
import { useUpdateEventCommission } from "@/features/admin/hooks";

/**
 * Admin đàm phán/miễn giảm phí riêng cho một sự kiện — công thức áp dụng khi
 * tính ví Organizer: phí/vé = giá vé × commissionRate + flatFeePerTicket (vé
 * 0đ luôn miễn phí). Mặc định 5% + 3.000đ khi tạo sự kiện.
 */
export function EventCommissionDialog({
  event,
  trigger,
}: {
  event: EventDetail;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [ratePercent, setRatePercent] = useState(String(event.commissionRate * 100));
  const [flatFee, setFlatFee] = useState(String(event.flatFeePerTicket));
  const [error, setError] = useState<string | null>(null);
  const updateCommission = useUpdateEventCommission();

  async function handleSubmit() {
    setError(null);
    try {
      await updateCommission.mutateAsync({
        eventId: event.id,
        body: { commissionRate: Number(ratePercent) / 100, flatFeePerTicket: Number(flatFee) },
      });
      setOpen(false);
    } catch (err) {
      setError(fallbackErrorMessage(err));
    }
  }

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)}>{trigger}</TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.title}>Phí nền tảng — {event.title}</Text>
            <Text style={styles.description}>
              Mặc định 5% + 3.000đ/vé. Sửa riêng khi có thỏa thuận đặc biệt (đối tác lớn, sự kiện
              thiện nguyện…). Vé giá 0đ luôn được miễn phí tự động.
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TextField
              label="Tỷ lệ hoa hồng (%)"
              keyboardType="decimal-pad"
              value={ratePercent}
              onChangeText={setRatePercent}
            />
            <TextField
              label="Phí cố định mỗi vé (VNĐ)"
              keyboardType="numeric"
              value={flatFee}
              onChangeText={setFlatFee}
            />

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setOpen(false)}>
                <Text style={styles.secondaryButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, updateCommission.isPending ? styles.disabled : null]}
                disabled={updateCommission.isPending}
                onPress={handleSubmit}
              >
                {updateCommission.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Lưu</Text>
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
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    gap: 12,
  },
  title: { fontSize: 17, fontWeight: "700", color: "#1d1d1f" },
  description: { fontSize: 13, color: "#6b6b70" },
  error: { fontSize: 13, color: "#d92d20" },
  actionsRow: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 4 },
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
  disabled: { opacity: 0.5 },
});
