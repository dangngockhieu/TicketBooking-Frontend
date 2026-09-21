import { http } from "@/lib/http-client";
import { env } from "@/lib/env";
import type {
  AccountSummary,
  AdminCreateOrganizerRequest,
  AdminCreateOrganizerResponse,
  Availability,
  AuthResponse,
  Booking,
  BookingFilter,
  Category,
  ChangePasswordRequest,
  CheckInRequest,
  CheckInResult,
  CreateBookingRequest,
  EventDetail,
  EventFilter,
  EventReport,
  EventSummary,
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  LoginRequest,
  PageResponse,
  Profile,
  QueueStatus,
  RecommendedEvent,
  RegisterRequest,
  ResendVerificationRequest,
  Transaction,
  UpdateAccountStatusRequest,
  UpdateProfileRequest,
  UpsertCategoryRequest,
  UpsertEventRequest,
  UserInfo,
  VerifyEmailRequest,
} from "@/types/api";

/**
 * API layer THẬT — mọi hook/component trong features/* chỉ import từ file này.
 * Không import http-client hay fetch trực tiếp ở nơi khác (docs/CONVENTIONS.md).
 */

function toQuery(params?: Record<string, unknown> | object): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (body: RegisterRequest) =>
    http<UserInfo>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
      auth: false,
    }),

  login: (body: LoginRequest) =>
    http<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
      auth: false,
    }),

  verifyEmail: (body: VerifyEmailRequest) =>
    http<AuthResponse>("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(body),
      auth: false,
    }),

  resendVerification: (body: ResendVerificationRequest) =>
    http<null>("/api/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify(body),
      auth: false,
    }),

  refresh: () => http<AuthResponse>("/api/auth/refresh", { method: "POST", auth: false }),

  logout: () => http<null>("/api/auth/logout", { method: "POST" }),

  getAccount: () => http<UserInfo>("/api/auth/account"),

  changePassword: (body: ChangePasswordRequest) =>
    http<null>("/api/auth/change-password", { method: "PUT", body: JSON.stringify(body) }),

  createOrganizer: (body: AdminCreateOrganizerRequest) =>
    http<AdminCreateOrganizerResponse>("/api/admin/organizers", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// ── User ──────────────────────────────────────────────────────────────────
export const userApi = {
  getMe: () => http<Profile>("/api/users/me"),
  updateMe: (body: UpdateProfileRequest) =>
    http<Profile>("/api/users/me", { method: "PUT", body: JSON.stringify(body) }),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return http<{ avatarUrl: string }>("/api/users/me/avatar", { method: "POST", body: form });
  },
};

// ── Catalog ───────────────────────────────────────────────────────────────
export const catalogApi = {
  getCategories: () => http<Category[]>("/api/categories"),

  getEvents: (filter: EventFilter = {}) =>
    http<PageResponse<EventSummary>>(`/api/events${toQuery(filter)}`),

  getEvent: (eventId: string) => http<EventDetail>(`/api/events/${eventId}`),

  getAvailability: (eventId: string) => http<Availability>(`/api/events/${eventId}/availability`),

  getOrganizerEvents: (params: { page?: number; size?: number; status?: string } = {}) =>
    http<PageResponse<EventSummary>>(`/api/organizer/events${toQuery(params)}`),

  createEvent: (body: UpsertEventRequest) =>
    http<EventDetail>("/api/events", { method: "POST", body: JSON.stringify(body) }),

  updateEvent: (eventId: string, body: UpsertEventRequest) =>
    http<EventDetail>(`/api/events/${eventId}`, { method: "PUT", body: JSON.stringify(body) }),

  publishEvent: (eventId: string) =>
    http<EventDetail>(`/api/events/${eventId}/publish`, { method: "PATCH" }),

  uploadBanner: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return http<{ url: string }>("/api/uploads/banner", { method: "POST", body: form });
  },
};

// ── Booking ───────────────────────────────────────────────────────────────
export const bookingApi = {
  create: (body: CreateBookingRequest, queueToken?: string | null) =>
    http<Booking>("/api/bookings", {
      method: "POST",
      body: JSON.stringify(body),
      headers: queueToken ? { "X-Queue-Token": queueToken } : undefined,
    }),

  get: (bookingId: string) => http<Booking>(`/api/bookings/${bookingId}`),

  getMine: (filter: BookingFilter = {}) =>
    http<PageResponse<Booking>>(`/api/bookings/me${toQuery(filter)}`),

  cancel: (bookingId: string) => http<Booking>(`/api/bookings/${bookingId}`, { method: "DELETE" }),

  checkIn: (body: CheckInRequest) =>
    http<CheckInResult>("/api/bookings/check-in", { method: "POST", body: JSON.stringify(body) }),
};

// ── Payment ───────────────────────────────────────────────────────────────
export const paymentApi = {
  initiate: (bookingId: string) =>
    http<InitiatePaymentResponse>("/api/payments/initiate", {
      method: "POST",
      body: JSON.stringify({
        bookingId,
        paymentMethod: "VNPAY",
        returnUrl: `${env.NEXT_PUBLIC_APP_URL}/payment/result`,
      } satisfies InitiatePaymentRequest),
    }),

  history: (params: { page?: number; size?: number } = {}) =>
    http<PageResponse<Transaction>>(`/api/payments/history${toQuery(params)}`),
};

// ── Queue ─────────────────────────────────────────────────────────────────
export const queueApi = {
  getStatus: (eventId: string) => http<QueueStatus>(`/api/queue/events/${eventId}/status`),
};

// ── Organizer report ──────────────────────────────────────────────────────
export const reportApi = {
  getEventReport: (eventId: string) => http<EventReport>(`/api/organizer/events/${eventId}/report`),
};

// ── Admin ─────────────────────────────────────────────────────────────────
export const adminApi = {
  getOrganizers: (
    params: { status?: string; page?: number; size?: number; keyword?: string } = {},
  ) => http<PageResponse<AccountSummary>>(`/api/admin/organizers${toQuery(params)}`),

  updateAccountStatus: (accountId: string, body: UpdateAccountStatusRequest) =>
    http<AccountSummary>(`/api/admin/accounts/${accountId}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  createCategory: (body: UpsertCategoryRequest) =>
    http<Category>("/api/admin/categories", { method: "POST", body: JSON.stringify(body) }),

  updateCategory: (id: string, body: UpsertCategoryRequest) =>
    http<Category>(`/api/admin/categories/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  deleteCategory: (id: string) => http<null>(`/api/admin/categories/${id}`, { method: "DELETE" }),
};

// ── Recommend ─────────────────────────────────────────────────────────────
export const recommendApi = {
  forYou: (limit = 10) =>
    http<RecommendedEvent[]>(`/api/recommendations/events/for-you?limit=${limit}`),
  similar: (eventId: string, limit = 5) =>
    http<RecommendedEvent[]>(`/api/recommendations/events/${eventId}/similar?limit=${limit}`),
};
