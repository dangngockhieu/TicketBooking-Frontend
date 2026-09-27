import type { AccountStatus, BookingStatus } from "@ticketbooking/shared";

export type { EventFilter } from "@ticketbooking/shared";

export interface PageQuery {
  page?: number;
  size?: number;
}

export interface BookingFilter extends PageQuery {
  status?: BookingStatus;
}

export interface AccountFilter extends PageQuery {
  status?: AccountStatus;
  keyword?: string;
}
