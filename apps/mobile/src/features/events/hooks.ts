import { useQuery } from "@tanstack/react-query";
import { catalogApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { EventFilter } from "@ticketbooking/shared";

export function useCategories() {
  return useQuery({
    queryKey: qk.categories,
    queryFn: catalogApi.getCategories,
    staleTime: 5 * 60_000,
  });
}

export function useEvents(filter: EventFilter) {
  return useQuery({ queryKey: qk.events(filter), queryFn: () => catalogApi.getEvents(filter) });
}

export function useEvent(eventId: string) {
  return useQuery({ queryKey: qk.event(eventId), queryFn: () => catalogApi.getEvent(eventId) });
}

/** Poll số vé còn lại mỗi 5s. Xem docs/06-booking-payment-flow.md §2. */
export function useAvailability(eventId: string) {
  return useQuery({
    queryKey: qk.availability(eventId),
    queryFn: () => catalogApi.getAvailability(eventId),
    refetchInterval: 5000,
  });
}
