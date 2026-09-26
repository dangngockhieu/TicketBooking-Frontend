import type { MonthKey, PayoutFilter } from "@ticketbooking/shared";
import type { BookingFilter, EventFilter, PageQuery } from "@/types/query";

/** Customer + Organizer — mobile chưa có màn Admin. */
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
  organizerEvents: (f: PageQuery & { status?: string }) => ["organizer", "events", f] as const,
  organizerDashboard: (month: MonthKey) => ["organizer", "dashboard", month] as const,
  report: (eventId: string) => ["organizer", "report", eventId] as const,
  wallet: ["organizer", "wallet"] as const,
  myPayouts: (f: PayoutFilter) => ["organizer", "payouts", f] as const,
};
