import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Pencil, Plus } from "lucide-react-native";
import { useAdminCategories } from "@/features/admin/hooks";
import { CategoryDialog } from "@/features/admin/components/category-dialog";
import { DeleteCategoryButton } from "@/features/admin/components/delete-category-button";

export default function AdminCategoriesScreen() {
  const { data: categories, isLoading, isError, refetch, isRefetching } = useAdminCategories();

  return (
    <View style={styles.container}>
      <FlatList
        data={categories ?? []}
        keyExtractor={(category) => category.id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={
          <CategoryDialog
            trigger={
              <View style={styles.createButton}>
                <Plus size={16} color="#fff" />
                <Text style={styles.createButtonText}>Thêm danh mục</Text>
              </View>
            }
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
              <Text style={styles.meta}>Chưa có danh mục nào.</Text>
            </View>
          )
        }
        renderItem={({ item: category }) => (
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{category.name}</Text>
              <Text style={styles.slug}>{category.slug}</Text>
              <Text style={styles.meta}>{category.description || "—"}</Text>
            </View>
            <View style={styles.cardActions}>
              <CategoryDialog
                category={category}
                trigger={
                  <View style={styles.iconButton}>
                    <Pencil size={16} color="#1d1d1f" />
                  </View>
                }
              />
              <DeleteCategoryButton category={category} />
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
  list: { padding: 16, gap: 12 },
  meta: { fontSize: 13, color: "#6b6b70" },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#4f46e5",
    marginBottom: 12,
  },
  createButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e5e5ea",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  cardInfo: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 14, fontWeight: "600", color: "#1d1d1f" },
  slug: { fontSize: 12, color: "#6b6b70", fontFamily: "monospace" },
  cardActions: { flexDirection: "row", gap: 4 },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
