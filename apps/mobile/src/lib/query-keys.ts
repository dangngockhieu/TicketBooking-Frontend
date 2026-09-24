import type { BookingFilter, EventFilter, PageQuery } from "@/types/query";

/** Chỉ phần Customer — mobile chưa có màn Organizer/Admin. */
export const qk = {
  categories: ["categories"] as const,
  events: (f: EventFilter) => ["events", f] as const,
  event: (id: string) => ["event", id] as const,
  availability: (id: string) => ["event", id, "availability"] as const,
  booking: (id: string) => ["booking", id] as const,
  myBookings: (f: BookingFilter) => ["bookings", "me", f] as const,
  paymentHistory: (f: PageQuery) => ["payments", "history", f] as const,
  queueStatus: (eventId: string) => ["queue", eventId] as const,
  me: ["me"] as const,
};
