import { useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Copy, TriangleAlert } from "lucide-react-native";
import { ApiError, fallbackErrorMessage } from "@ticketbooking/shared";
import { TextField } from "@/components/text-field";
import { useCreateOrganizerAccount } from "@/features/admin/hooks";

/**
 * tempPassword chỉ được trả về MỘT LẦN trong response — server không lưu bản rõ.
 * Reload danh sách sẽ không thấy lại được. Xem docs/05-api-contract.md §2.9.
 */
export function CreateOrganizerDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const createOrganizer = useCreateOrganizerAccount();

  function reset() {
    setEmail("");
    setFullName("");
    setEmailError(null);
    setFormError(null);
    setCreated(null);
    setCopied(false);
  }

  async function handleSubmit() {
    setEmailError(null);
    setFormError(null);
    try {
      const res = await createOrganizer.mutateAsync({ email, fullName });
      setCreated({ email: res.account.email, tempPassword: res.tempPassword });
    } catch (err) {
      if (err instanceof ApiError && err.httpStatus === 409) {
        setEmailError(err.message);
        return;
      }
      setFormError(fallbackErrorMessage(err));
    }
  }

  async function copyPassword() {
    if (!created) return;
    await Clipboard.setStringAsync(created.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                <Text style={styles.description}>{created.email}</Text>

                <View style={styles.warningBox}>
                  <View style={styles.warningRow}>
                    <TriangleAlert size={16} color="#92400e" />
                    <Text style={styles.warningText}>
                      Mật khẩu tạm chỉ hiển thị một lần. Hãy sao chép và gửi cho Organizer ngay bây
                      giờ.
                    </Text>
                  </View>
                  <View style={styles.passwordRow}>
                    <Text style={styles.passwordText}>{created.tempPassword}</Text>
                    <TouchableOpacity style={styles.copyButton} onPress={copyPassword}>
                      <Copy size={16} color="#1d1d1f" />
                    </TouchableOpacity>
                  </View>
                  {copied ? <Text style={styles.copiedText}>Đã sao chép</Text> : null}
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
                  Hệ thống sẽ sinh mật khẩu tạm, Organizer bắt buộc đổi ở lần đăng nhập đầu.
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
    borderColor: "#fde68a",
    backgroundColor: "#fffbeb",
    borderRadius: 10,
    padding: 14,
  },
  warningRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  warningText: { flex: 1, fontSize: 13, color: "#1d1d1f" },
  passwordRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  passwordText: {
    flex: 1,
    fontFamily: "monospace",
    fontSize: 14,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    alignItems: "center",
    justifyContent: "center",
  },
  copiedText: { fontSize: 12, color: "#059669" },
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
