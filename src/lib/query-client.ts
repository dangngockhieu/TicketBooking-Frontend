import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/types/api";

/** Mặc định TanStack Query — retry chỉ cho lỗi mạng/5xx, không retry lỗi nghiệp vụ 4xx. */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.httpStatus < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}
