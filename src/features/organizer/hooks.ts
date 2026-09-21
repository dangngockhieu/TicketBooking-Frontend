"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingApi, catalogApi, reportApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { UpsertEventRequest } from "@/types/api";
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

export function useCheckIn() {
  return useMutation({
    mutationFn: ({ qrCodeData, eventId }: { qrCodeData: string; eventId: string }) =>
      bookingApi.checkIn({ qrCodeData, eventId }),
  });
}
