"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, authApi, catalogApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { AccountFilter } from "@/types/query";
import type {
  AdminCreateOrganizerRequest,
  UpdateAccountStatusRequest,
  UpsertCategoryRequest,
} from "@/types/api";

export function useOrganizerAccounts(filter: AccountFilter) {
  return useQuery({ queryKey: qk.adminOrganizers(filter), queryFn: () => adminApi.getOrganizers(filter) });
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
    mutationFn: ({ id, body }: { id: string; body: UpsertCategoryRequest }) => adminApi.updateCategory(id, body),
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
