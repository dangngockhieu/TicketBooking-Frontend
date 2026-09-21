"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { BookingFilter, CreateBookingRequest } from "@/types/api";

export function useBooking(bookingId: string) {
  return useQuery({ queryKey: qk.booking(bookingId), queryFn: () => bookingApi.get(bookingId) });
}

export function useMyBookings(filter: BookingFilter) {
  return useQuery({ queryKey: qk.myBookings(filter), queryFn: () => bookingApi.getMine(filter) });
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: ({
      body,
      queueToken,
    }: {
      body: CreateBookingRequest;
      queueToken?: string | null;
    }) => bookingApi.create(body, queueToken),
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => bookingApi.cancel(bookingId),
    onSuccess: (_data, bookingId) => {
      queryClient.invalidateQueries({ queryKey: qk.booking(bookingId) });
    },
  });
}
