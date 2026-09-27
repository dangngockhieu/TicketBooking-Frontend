import { useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ApiError, fallbackErrorMessage, type Category } from "@ticketbooking/shared";
import { TextField } from "@/components/text-field";
import { useCreateCategory, useUpdateCategory } from "@/features/admin/hooks";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function CategoryDialog({
  category,
  trigger,
}: {
  category?: Category;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const isEdit = !!category;
  const isPending = createCategory.isPending || updateCategory.isPending;

  async function handleSubmit() {
    setError(null);
    try {
      const body = { name, slug, description: description || null };
      if (isEdit) await updateCategory.mutateAsync({ id: category.id, body });
      else await createCategory.mutateAsync(body);
      setOpen(false);
    } catch (err) {
      if (err instanceof ApiError && (err.httpStatus === 409 || err.httpStatus === 400)) {
        setError(err.message);
        return;
      }
      setError(fallbackErrorMessage(err));
    }
  }

  const canSubmit = name.trim() !== "" && slug.trim() !== "";

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)}>{trigger}</TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.title}>{isEdit ? "Sửa danh mục" : "Thêm danh mục"}</Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TextField
              label="Tên *"
              value={name}
              onChangeText={(v) => {
                setName(v);
                if (!isEdit) setSlug(slugify(v));
              }}
            />
            <TextField label="Slug *" value={slug} onChangeText={setSlug} />
            <TextField
              label="Mô tả"
              value={description ?? ""}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={styles.textarea}
            />

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setOpen(false)}>
                <Text style={styles.secondaryButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, !canSubmit || isPending ? styles.disabled : null]}
                disabled={!canSubmit || isPending}
                onPress={handleSubmit}
              >
                {isPending ? (
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
  title: { fontSize: 18, fontWeight: "700", color: "#1d1d1f" },
  error: { fontSize: 13, color: "#d92d20" },
  textarea: { height: 80, textAlignVertical: "top", paddingTop: 10 },
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
