import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { formatDate } from "@ticketbooking/shared";
import { StatusBadge } from "@/components/status-badge";
import { CreateOrganizerDialog } from "@/features/admin/components/create-organizer-dialog";
import { AccountStatusDialog } from "@/features/admin/components/account-status-dialog";
import { useOrganizerAccounts } from "@/features/admin/hooks";
import type { AccountStatus } from "@ticketbooking/shared";

const TABS: { label: string; value: AccountStatus | undefined }[] = [
  { label: "Tất cả", value: undefined },
  { label: "Hoạt động", value: "ACTIVE" },
  { label: "Đã khóa", value: "LOCKED" },
];

export default function AdminOrganizersScreen() {
  const [status, setStatus] = useState<AccountStatus | undefined>(undefined);
  const [keyword, setKeyword] = useState("");
  const { data, isLoading, isError, refetch, isRefetching } = useOrganizerAccounts({
    status,
    keyword: keyword || undefined,
    page: 1,
    size: 50,
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(account) => account.id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={
          <>
            <CreateOrganizerDialog />
            <TextInput
              value={keyword}
              onChangeText={setKeyword}
              placeholder="Tìm theo email…"
              style={styles.searchInput}
            />
            <FlatList
              data={TABS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(tab) => tab.label}
              contentContainerStyle={styles.tabsRow}
              style={styles.tabsList}
              renderItem={({ item }) => {
                const active = status === item.value;
                return (
                  <TouchableOpacity
                    style={[styles.tab, active ? styles.tabActive : null]}
                    onPress={() => setStatus(item.value)}
                  >
                    <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </>
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
              <Text style={styles.meta}>Chưa có tài khoản Organizer nào.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.email}</Text>
              <Text style={styles.meta}>{formatDate(item.createdAt)}</Text>
              <StatusBadge status={item.status} />
            </View>
            <AccountStatusDialog account={item} />
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
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    marginTop: 12,
  },
  tabsList: { marginVertical: 12 },
  tabsRow: { gap: 8, paddingBottom: 4 },
  tab: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  tabText: { fontSize: 13, fontWeight: "500", color: "#1d1d1f" },
  tabTextActive: { color: "#fff" },
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
  cardInfo: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 14, fontWeight: "600", color: "#1d1d1f" },
});
