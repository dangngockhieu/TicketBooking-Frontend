import { useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Trash2 } from "lucide-react-native";
import { ApiError, fallbackErrorMessage, type Category } from "@ticketbooking/shared";
import { useDeleteCategory } from "@/features/admin/hooks";

export function DeleteCategoryButton({ category }: { category: Category }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deleteCategory = useDeleteCategory();

  async function handleConfirm() {
    setError(null);
    try {
      await deleteCategory.mutateAsync(category.id);
      setOpen(false);
    } catch (err) {
      if (err instanceof ApiError && err.httpStatus === 409) {
        setError(err.message || "Danh mục đang được sự kiện sử dụng, không thể xóa.");
        return;
      }
      setError(fallbackErrorMessage(err));
    }
  }

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setOpen(true)}
        accessibilityLabel={`Xóa danh mục ${category.name}`}
      >
        <Trash2 size={16} color="#d92d20" />
      </TouchableOpacity>

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.title}>Xóa danh mục &quot;{category.name}&quot;?</Text>
            <Text style={styles.description}>
              Không thể hoàn tác. Nếu danh mục đang được sự kiện nào đó sử dụng, thao tác sẽ bị từ
              chối.
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setOpen(false)}>
                <Text style={styles.secondaryButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dangerButton, deleteCategory.isPending ? styles.disabled : null]}
                disabled={deleteCategory.isPending}
                onPress={handleConfirm}
              >
                {deleteCategory.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.dangerButtonText}>Xóa</Text>
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
  trigger: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  dialog: { width: "100%", backgroundColor: "#fff", borderRadius: 14, padding: 20, gap: 12 },
  title: { fontSize: 16, fontWeight: "700", color: "#1d1d1f" },
  description: { fontSize: 13, color: "#6b6b70" },
  error: { fontSize: 13, color: "#d92d20" },
  actionsRow: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 4 },
  dangerButton: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: "#d92d20",
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  secondaryButton: {
    height: 44,
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
