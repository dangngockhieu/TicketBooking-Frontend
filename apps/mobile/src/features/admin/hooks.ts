import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, authApi, catalogApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { AccountFilter } from "@/types/query";
import type {
  AdminCreateOrganizerRequest,
  AdminEventFilter,
  MonthKey,
  PayoutFilter,
  UpdateAccountStatusRequest,
  UpdateEventCommissionRequest,
  UpdatePayoutRequestStatus,
  UpsertCategoryRequest,
} from "@ticketbooking/shared";

export function useOrganizerAccounts(filter: AccountFilter) {
  return useQuery({
    queryKey: qk.adminOrganizers(filter),
    queryFn: () => adminApi.getOrganizers(filter),
  });
}

export function useCreateOrganizerAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AdminCreateOrganizerRequest) => authApi.createOrganizer(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "organizers"] }),
  });
}

export function useUpdateAccountStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, body }: { accountId: string; body: UpdateAccountStatusRequest }) =>
      adminApi.updateAccountStatus(accountId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "organizers"] }),
  });
}

export function useAdminCategories() {
  return useQuery({ queryKey: qk.categories, queryFn: catalogApi.getCategories });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertCategoryRequest) => adminApi.createCategory(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.categories }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpsertCategoryRequest }) =>
      adminApi.updateCategory(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.categories }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.categories }),
  });
}

export function useAllEventsAdmin(filter: AdminEventFilter = {}) {
  return useQuery({
    queryKey: qk.adminEvents(filter),
    queryFn: () => catalogApi.getAllEventsAdmin(filter),
  });
}

/** Admin đàm phán/sửa phí nền tảng riêng cho một sự kiện. Xem EventDetail.commissionRate. */
export function useUpdateEventCommission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, body }: { eventId: string; body: UpdateEventCommissionRequest }) =>
      adminApi.updateEventCommission(eventId, body),
    onSuccess: (_data, { eventId }) =>
      queryClient.invalidateQueries({ queryKey: qk.event(eventId) }),
  });
}

export function useAllPayoutRequests(filter: PayoutFilter) {
  return useQuery({
    queryKey: qk.adminPayouts(filter),
    queryFn: () => adminApi.getAllPayoutRequests(filter),
  });
}

export function useUpdatePayoutRequestStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, body }: { requestId: string; body: UpdatePayoutRequestStatus }) =>
      adminApi.updatePayoutRequestStatus(requestId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "payouts"] }),
  });
}

export function useAdminDashboard(month: MonthKey) {
  return useQuery({
    queryKey: qk.adminDashboard(month),
    queryFn: () => adminApi.getDashboardStats(month),
    placeholderData: keepPreviousData,
  });
}
