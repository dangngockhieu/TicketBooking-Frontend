"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { paymentApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";

export function useInitiatePayment() {
  return useMutation({ mutationFn: (bookingId: string) => paymentApi.initiate(bookingId) });
}

export function usePaymentHistory(params: { page?: number; size?: number } = {}) {
  return useQuery({ queryKey: qk.paymentHistory(params), queryFn: () => paymentApi.history(params) });
}
