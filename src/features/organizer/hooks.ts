"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingApi, catalogApi, payoutApi, reportApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type {
  CreatePayoutRequest,
  DashboardPeriod,
  PayoutFilter,
  UpsertEventRequest,
} from "@/types/api";
import type { PageQuery } from "@/types/query";

export function useOrganizerEvents(params: PageQuery & { status?: string } = {}) {
  return useQuery({
    queryKey: qk.organizerEvents(params),
    queryFn: () => catalogApi.getOrganizerEvents(params),
  });
}

export function useOrganizerEvent(eventId: string) {
  return useQuery({
    queryKey: qk.event(eventId),
    queryFn: () => catalogApi.getEvent(eventId),
    enabled: !!eventId,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertEventRequest) => catalogApi.createEvent(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organizer", "events"] }),
  });
}

export function useUpdateEvent(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertEventRequest) => catalogApi.updateEvent(eventId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.event(eventId) });
      queryClient.invalidateQueries({ queryKey: ["organizer", "events"] });
    },
  });
}

export function usePublishEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => catalogApi.publishEvent(eventId),
    onSuccess: (_data, eventId) => {
      queryClient.invalidateQueries({ queryKey: qk.event(eventId) });
      queryClient.invalidateQueries({ queryKey: ["organizer", "events"] });
    },
  });
}

export function useUploadBanner() {
  return useMutation({ mutationFn: (file: File) => catalogApi.uploadBanner(file) });
}

export function useEventReport(eventId: string) {
  return useQuery({
    queryKey: qk.report(eventId),
    queryFn: () => reportApi.getEventReport(eventId),
    enabled: !!eventId,
  });
}

export function useOrganizerDashboard(period: DashboardPeriod) {
  return useQuery({
    queryKey: qk.organizerDashboard(period),
    queryFn: () => reportApi.getDashboardStats(period),
  });
}

export function useCheckIn() {
  return useMutation({
    mutationFn: ({ qrCodeData, eventId }: { qrCodeData: string; eventId: string }) =>
      bookingApi.checkIn({ qrCodeData, eventId }),
  });
}

/** Ví Organizer — số dư khả dụng từ các sự kiện COMPLETED. Xem docs/11-payout-commission.md. */
export function useWallet() {
  return useQuery({ queryKey: qk.wallet, queryFn: payoutApi.getWallet });
}

export function useMyPayoutRequests(filter: PayoutFilter = {}) {
  return useQuery({
    queryKey: qk.myPayouts(filter),
    queryFn: () => payoutApi.getMyPayoutRequests(filter),
  });
}

export function useCreatePayoutRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePayoutRequest) => payoutApi.createPayoutRequest(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.wallet });
      queryClient.invalidateQueries({ queryKey: ["organizer", "payouts"] });
    },
  });
}
