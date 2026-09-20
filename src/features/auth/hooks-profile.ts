"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { UpdateProfileRequest } from "@/types/api";

export function useProfile() {
  return useQuery({ queryKey: qk.me, queryFn: userApi.getMe });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => userApi.updateMe(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.me }),
  });
}
