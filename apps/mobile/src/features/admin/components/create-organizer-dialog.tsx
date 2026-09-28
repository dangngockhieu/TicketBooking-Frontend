import { useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MailCheck } from "lucide-react-native";
import { ApiError, fallbackErrorMessage } from "@ticketbooking/shared";
import { TextField } from "@/components/text-field";
import { useCreateOrganizerAccount } from "@/features/admin/hooks";

/**
 * Server sinh mật khẩu tạm và gửi thẳng qua email cho Organizer — Admin không bao giờ
 * thấy mật khẩu này. Xem docs/04-auth-flow.md §3.3c.
 */
export function CreateOrganizerDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const createOrganizer = useCreateOrganizerAccount();

  function reset() {
    setEmail("");
    setFullName("");
    setEmailError(null);
    setFormError(null);
    setCreated(null);
  }

  async function handleSubmit() {
    setEmailError(null);
    setFormError(null);
    try {
      const res = await createOrganizer.mutateAsync({ email, fullName });
      setCreated(res.account.email);
    } catch (err) {
      if (err instanceof ApiError && err.httpStatus === 409) {
        setEmailError(err.message);
        return;
      }
      setFormError(fallbackErrorMessage(err));
    }
  }

  const canSubmit = email.trim() !== "" && fullName.trim() !== "";

  return (
    <>
      <TouchableOpacity style={styles.triggerButton} onPress={() => setOpen(true)}>
        <Text style={styles.triggerButtonText}>Tạo tài khoản Organizer</Text>
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
            {created ? (
              <>
                <Text style={styles.title}>Đã tạo tài khoản</Text>
                <Text style={styles.description}>{created}</Text>

                <View style={styles.warningBox}>
                  <View style={styles.warningRow}>
                    <MailCheck size={16} color="#4f46e5" />
                    <Text style={styles.warningText}>
                      Mật khẩu tạm đã được gửi tới email {created}. Organizer sẽ phải đổi mật khẩu ở
                      lần đăng nhập đầu tiên.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    setOpen(false);
                    reset();
                  }}
                >
                  <Text style={styles.primaryButtonText}>Đóng</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.title}>Tạo tài khoản Organizer</Text>
                <Text style={styles.description}>
                  Hệ thống sẽ sinh mật khẩu tạm và gửi qua email cho Organizer. Organizer bắt buộc
                  đổi mật khẩu ở lần đăng nhập đầu.
                </Text>

                {formError ? <Text style={styles.error}>{formError}</Text> : null}

                <TextField
                  label="Email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  error={emailError ?? undefined}
                />
                <TextField label="Họ tên" value={fullName} onChangeText={setFullName} />

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
                      !canSubmit || createOrganizer.isPending ? styles.disabled : null,
                    ]}
                    disabled={!canSubmit || createOrganizer.isPending}
                    onPress={handleSubmit}
                  >
                    {createOrganizer.isPending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Tạo tài khoản</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  warningBox: {
    gap: 10,
    borderWidth: 1,
    borderColor: "#c7d2fe",
    backgroundColor: "#eef2ff",
    borderRadius: 10,
    padding: 14,
  },
  warningRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  warningText: { flex: 1, fontSize: 13, color: "#1d1d1f" },
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
