import type { AccountStatus, BookingStatus, EventFilter } from "@/types/api";

export type { EventFilter } from "@/types/api";

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

export type { EventFilter as EventFilterQuery };
