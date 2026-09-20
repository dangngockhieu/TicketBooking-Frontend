import type { AccountFilter, BookingFilter, EventFilter, PageQuery } from "@/types/query";

export const qk = {
  categories: ["categories"] as const,
  events: (f: EventFilter) => ["events", f] as const,
  event: (id: string) => ["event", id] as const,
  availability: (id: string) => ["event", id, "availability"] as const,
  recommendForYou: ["recommend", "for-you"] as const,
  recommendSimilar: (id: string) => ["recommend", "similar", id] as const,
  booking: (id: string) => ["booking", id] as const,
  myBookings: (f: BookingFilter) => ["bookings", "me", f] as const,
  paymentHistory: (f: PageQuery) => ["payments", "history", f] as const,
  queueStatus: (eventId: string) => ["queue", eventId] as const,
  organizerEvents: (f: PageQuery) => ["organizer", "events", f] as const,
  report: (eventId: string) => ["organizer", "report", eventId] as const,
  adminOrganizers: (f: AccountFilter) => ["admin", "organizers", f] as const,
  me: ["me"] as const,
};
