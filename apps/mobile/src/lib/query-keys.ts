import type { AdminEventFilter, MonthKey, PayoutFilter } from "@ticketbooking/shared";
import type { AccountFilter, BookingFilter, EventFilter, PageQuery } from "@/types/query";

/** Customer + Organizer + Admin. */
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
  adminOrganizers: (f: AccountFilter) => ["admin", "organizers", f] as const,
  adminEvents: (f: AdminEventFilter) => ["admin", "events", f] as const,
  adminPayouts: (f: PayoutFilter) => ["admin", "payouts", f] as const,
  adminDashboard: (month: MonthKey) => ["admin", "dashboard", month] as const,
};
