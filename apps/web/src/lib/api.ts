import { http } from "@/lib/http-client";
import { env } from "@/lib/env";
import type {
  AccountSummary,
  AdminCreateOrganizerRequest,
  AdminCreateOrganizerResponse,
  AdminDashboardStats,
  Availability,
  AuthResponse,
  AdminEventFilter,
  BankAccountResponse,
  BankAccountRequest,
  Booking,
  BookingFilter,
  Category,
  ChangePasswordRequest,
  CheckInRequest,
  CheckInResult,
  CreateBookingRequest,
  CreatePayoutRequest,
  DashboardWeek,
  EventDetail,
  EventFilter,
  EventReport,
  EventSummary,
  ForgotPasswordRequest,
  InitiatePaymentResponse,
  LoginRequest,
  MonthKey,
  OrganizerDashboardStats,
  OrganizerWallet,
  PageResponse,
  PayoutFilter,
  PayoutRequest,
  Profile,
  QueueStatus,
  RecommendedEvent,
  RegisterRequest,
  ResendVerificationRequest,
  ResetPasswordRequest,
  SaleState,
  TicketClass,
  Transaction,
  UpdateAccountStatusRequest,
  UpdateEventCommissionRequest,
  UpdatePayoutRequestStatus,
  UpdateProfileRequest,
  UpsertCategoryRequest,
  UpsertEventRequest,
  UserInfo,
  VerifyEmailRequest,
} from "@ticketbooking/shared";

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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/**
 * Chuẩn hóa Event từ backend:
 * Backend trả CategoryRef(id, name) và TicketClassSummary(price, availableQuantity, totalQuantity).
 * Hàm này tự động tính toán minPrice, derive saleState, và bổ sung category.slug để tương thích hoàn toàn với UI.
 */
export function normalizeEvent<T extends Partial<EventDetail>>(raw: T): EventDetail {
  const ticketClasses: TicketClass[] = (raw.ticketClasses ?? []).map((tc, idx) => ({
    id: tc.id ?? `tc-${idx}`,
    name: tc.name ?? "Standard",
    description: tc.description ?? null,
    price: Number(tc.price ?? 0),
    totalQuantity: tc.totalQuantity ?? 0,
    availableQuantity: tc.availableQuantity ?? 0,
    sortOrder: tc.sortOrder ?? idx + 1,
  }));

  const prices = ticketClasses.map((t) => t.price);
  const minPrice = raw.minPrice ?? (prices.length > 0 ? Math.min(...prices) : 0);

  let saleState: SaleState = raw.saleState ?? "ON_SALE";
  if (!raw.saleState) {
    const now = Date.now();
    const start = raw.saleStartTime ? Date.parse(raw.saleStartTime) : null;
    const end = raw.saleEndTime ? Date.parse(raw.saleEndTime) : null;
    const allSoldOut =
      ticketClasses.length > 0 && ticketClasses.every((t) => t.availableQuantity <= 0);

    if (start && now < start) saleState = "NOT_STARTED";
    else if (end && now > end) saleState = "ENDED";
    else if (allSoldOut) saleState = "SOLD_OUT";
    else saleState = "ON_SALE";
  }

  const categoryName =
    typeof raw.category === "string" ? raw.category : (raw.category?.name ?? "Chung");
  const categorySlug =
    (typeof raw.category === "object" && raw.category?.slug) || slugify(categoryName) || "chung";

  return {
    ...raw,
    id: raw.id ?? "",
    title: raw.title ?? "",
    category: {
      id: typeof raw.category === "object" ? (raw.category?.id ?? "") : "",
      name: categoryName,
      slug: categorySlug,
    },
    location: raw.location ?? "",
    venueName: raw.venueName ?? null,
    bannerUrl: raw.bannerUrl ?? null,
    startTime: raw.startTime ?? new Date().toISOString(),
    endTime: raw.endTime ?? new Date().toISOString(),
    saleStartTime: raw.saleStartTime ?? null,
    saleEndTime: raw.saleEndTime ?? null,
    status: raw.status ?? "PUBLISHED",
    description: raw.description ?? null,
    organizerId: raw.organizerId ?? "",
    commissionRate: Number(raw.commissionRate ?? 0.05),
    flatFeePerTicket: Number(raw.flatFeePerTicket ?? 3000),
    minPrice,
    saleState,
    ticketClasses,
  } as EventDetail;
}

async function enrichBooking(raw: Record<string, unknown> | Booking): Promise<Booking> {
  if (!raw) return raw as Booking;
  const rawRec = raw as Record<string, unknown>;
  const rawEvent = rawRec.event as Record<string, unknown> | undefined;
  const eventId = String(rawRec.eventId ?? rawEvent?.id ?? "");
  let event = rawRec.event;

  if (!event && eventId) {
    try {
      const evt = await catalogApi.getEvent(eventId);
      event = {
        id: evt.id,
        title: evt.title,
        bannerUrl: evt.bannerUrl,
        startTime: evt.startTime,
        location: evt.location,
      };
    } catch {
      event = {
        id: eventId,
        title: "Sự kiện",
        bannerUrl: null,
        startTime: String(rawRec.createdAt ?? new Date().toISOString()),
        location: "",
      };
    }
  }

  const rawItems = (rawRec.items as Array<Record<string, unknown>>) ?? [];

  return {
    ...rawRec,
    event: (event ?? {
      id: eventId,
      title: "Sự kiện",
      bannerUrl: null,
      startTime: new Date().toISOString(),
      location: "",
    }) as Booking["event"],
    items: rawItems.map((it) => ({
      ticketClassId: String(it.ticketClassId ?? ""),
      ticketClassName: String(it.ticketClassName ?? ""),
      quantity: Number(it.quantity ?? 1),
      unitPrice: Number(it.unitPrice ?? 0),
      subtotal: Number(it.subtotal ?? Number(it.unitPrice ?? 0) * Number(it.quantity ?? 1)),
    })),
    tickets: (rawRec.tickets as Booking["tickets"]) ?? [],
  } as Booking;
}

/** Part "data" phải mang Content-Type application/json để Spring bind @RequestPart. */
function eventFormData(body: UpsertEventRequest, image?: File | null): FormData {
  const form = new FormData();
  form.append("data", new Blob([JSON.stringify(body)], { type: "application/json" }));
  if (image) form.append("image", image);
  return form;
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

  /** Gửi email chứa mã OTP đặt lại mật khẩu */
  forgotPassword: (body: ForgotPasswordRequest) =>
    http<null>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(body),
      auth: false,
    }),

  resetPassword: (body: ResetPasswordRequest) =>
    http<null>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(body),
      auth: false,
    }),

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
  uploadAvatar: async (file: File) => {
    try {
      const form = new FormData();
      form.append("file", file);
      return await http<{ avatarUrl: string }>("/api/users/me/avatar", {
        method: "POST",
        body: form,
      });
    } catch {
      // Fallback preview
      return { avatarUrl: URL.createObjectURL(file) };
    }
  },
};

// ── Catalog ───────────────────────────────────────────────────────────────
export const catalogApi = {
  getCategories: () => http<Category[]>("/api/categories"),

  getEvents: async (filter: EventFilter = {}): Promise<PageResponse<EventSummary>> => {
    const res = await http<PageResponse<EventSummary>>(`/api/events${toQuery(filter)}`);
    return {
      ...res,
      items: (res.items ?? []).map((e) => normalizeEvent(e)),
    };
  },

  getEvent: async (eventId: string): Promise<EventDetail> => {
    const res = await http<EventDetail>(`/api/events/${eventId}`);
    return normalizeEvent(res);
  },

  getAvailability: async (eventId: string): Promise<Availability> => {
    const event = await catalogApi.getEvent(eventId);
    return {
      eventId: event.id,
      saleState: event.saleState,
      ticketClasses: event.ticketClasses.map((tc) => ({
        id: tc.id,
        availableQuantity: tc.availableQuantity,
      })),
    };
  },

  getOrganizerEvents: async (
    params: { page?: number; size?: number; status?: string } = {},
  ): Promise<PageResponse<EventSummary>> => {
    const res = await http<PageResponse<EventSummary>>(`/api/events${toQuery(params)}`);
    return {
      ...res,
      items: (res.items ?? []).map((e) => normalizeEvent(e)),
    };
  },

  /** multipart: part "data" = JSON UpsertEventRequest, part "image" = banner (tùy chọn). */
  createEvent: async (body: UpsertEventRequest, image?: File | null): Promise<EventDetail> => {
    const res = await http<EventDetail>("/api/events", {
      method: "POST",
      body: eventFormData(body, image),
    });
    return normalizeEvent(res);
  },

  /** Gửi image mới thì backend xóa banner cũ và thay bằng ảnh này. */
  updateEvent: async (
    eventId: string,
    body: UpsertEventRequest,
    image?: File | null,
  ): Promise<EventDetail> => {
    const res = await http<EventDetail>(`/api/events/${eventId}`, {
      method: "PUT",
      body: eventFormData(body, image),
    });
    return normalizeEvent(res);
  },

  publishEvent: async (eventId: string): Promise<EventDetail> => {
    const res = await http<EventDetail>(`/api/events/${eventId}/publish`, { method: "PATCH" });
    return normalizeEvent(res);
  },

  getAllEventsAdmin: async (params: AdminEventFilter = {}): Promise<PageResponse<EventDetail>> => {
    const res = await http<PageResponse<EventDetail>>(`/api/events${toQuery(params)}`);
    return {
      ...res,
      items: (res.items ?? []).map((e) => normalizeEvent(e)),
    };
  },
};

// ── Booking ───────────────────────────────────────────────────────────────
export const bookingApi = {
  create: async (body: CreateBookingRequest, queueToken?: string | null): Promise<Booking> => {
    const payload = {
      ...body,
      queueAccessToken: body.queueAccessToken ?? queueToken ?? undefined,
    };
    const res = await http<Booking>("/api/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: queueToken ? { "X-Queue-Token": queueToken } : undefined,
    });
    return enrichBooking(res);
  },

  get: async (bookingId: string): Promise<Booking> => {
    const res = await http<Record<string, unknown>>(`/api/bookings/${bookingId}`);
    return enrichBooking(res);
  },

  getMine: async (filter: BookingFilter = {}): Promise<PageResponse<Booking>> => {
    const res = await http<PageResponse<Record<string, unknown>>>(
      `/api/bookings/me${toQuery(filter)}`,
    );
    const items = await Promise.all((res.items ?? []).map((b) => enrichBooking(b)));
    return { ...res, items };
  },

  cancel: (bookingId: string) => http<Booking>(`/api/bookings/${bookingId}`, { method: "DELETE" }),

  checkIn: (body: CheckInRequest) =>
    http<CheckInResult>("/api/bookings/check-in", {
      method: "POST",
      body: JSON.stringify({ qrCodeData: body.qrCodeData }),
    }),
};

// ── Payment ───────────────────────────────────────────────────────────────
export const paymentApi = {
  initiate: (bookingId: string) =>
    http<InitiatePaymentResponse>("/api/payments/initiate", {
      method: "POST",
      body: JSON.stringify({
        bookingId,
        returnUrl: `${env.NEXT_PUBLIC_APP_URL}/payment/result`,
      }),
    }),

  history: async (
    params: { page?: number; size?: number } = {},
  ): Promise<PageResponse<Transaction>> => {
    try {
      return await http<PageResponse<Transaction>>(`/api/payments/history${toQuery(params)}`);
    } catch {
      return {
        items: [],
        page: params.page ?? 1,
        size: params.size ?? 20,
        totalElements: 0,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };
    }
  },
};

// ── Queue ─────────────────────────────────────────────────────────────────
export const queueApi = {
  getStatus: async (eventId: string): Promise<QueueStatus> => {
    try {
      const res = await http<{ eventId: string; queueRequired: boolean }>(
        `/api/queue/${eventId}/status`,
      );
      return {
        eventId: res.eventId,
        queueEnabled: res.queueRequired,
        totalWaiting: 0,
        estimatedWaitTimeSeconds: 0,
      };
    } catch {
      return { eventId, queueEnabled: false, totalWaiting: 0, estimatedWaitTimeSeconds: 0 };
    }
  },
};

// ── Organizer report ──────────────────────────────────────────────────────
export const reportApi = {
  getEventReport: async (eventId: string): Promise<EventReport> => {
    const res = await http<Record<string, unknown>>(
      `/api/bookings/organizer/events/${eventId}/report`,
    );
    const totalRev = Number(res.totalRevenue ?? 0);
    const rawClasses = (res.byTicketClass as Array<Record<string, unknown>>) ?? [];
    return {
      eventId: String(res.eventId ?? eventId),
      eventTitle: String(res.eventTitle ?? "Báo cáo sự kiện"),
      summary: {
        totalRevenue: totalRev,
        totalPlatformFee: 0,
        netRevenue: totalRev,
        totalTicketsSold: Number(res.totalTicketsSold ?? 0),
        totalTicketsCheckedIn: Number(res.totalCheckedIn ?? 0),
        checkInRate: Number(res.checkInRate ?? 0),
      },
      byTicketClass: rawClasses.map((tc) => ({
        ticketClassId: String(tc.ticketClassId ?? ""),
        name: String(tc.name ?? ""),
        price: Number(Number(tc.sold ?? 0) > 0 ? Number(tc.revenue ?? 0) / Number(tc.sold) : 0),
        totalQuantity: Number(tc.totalQuantity ?? 0),
        sold: Number(tc.sold ?? 0),
        checkedIn: Number(tc.checkedIn ?? 0),
        revenue: Number(tc.revenue ?? 0),
      })),
    };
  },

  getDashboardStats: async (month: MonthKey): Promise<OrganizerDashboardStats> => {
    try {
      const eventsPage = await catalogApi.getEvents({ size: 50 });
      return computeOrganizerDashboard(eventsPage.items, month);
    } catch {
      return emptyOrganizerDashboard(month);
    }
  },
};

// ── Bank Account (Organizer & Admin) ──────────────────────────────────────
export const bankAccountApi = {
  getMyBankAccount: () => http<BankAccountResponse | null>("/api/organizer/bank-account"),
  upsertMyBankAccount: (body: BankAccountRequest) =>
    http<BankAccountResponse>("/api/organizer/bank-account", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  verify: (organizerId: string) =>
    http<BankAccountResponse>(`/api/admin/organizers/${organizerId}/bank-account/verify`, {
      method: "PATCH",
    }),
};

// ── Admin ─────────────────────────────────────────────────────────────────
export const adminApi = {
  getOrganizers: async (
    params: { status?: string; page?: number; size?: number; keyword?: string } = {},
  ): Promise<PageResponse<AccountSummary>> => {
    try {
      return await http<PageResponse<AccountSummary>>(`/api/admin/organizers${toQuery(params)}`);
    } catch {
      return {
        items: [],
        page: params.page ?? 1,
        size: params.size ?? 20,
        totalElements: 0,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };
    }
  },

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

  updateEventCommission: (eventId: string, body: UpdateEventCommissionRequest) =>
    http<EventDetail>(`/api/admin/events/${eventId}/fees`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  getAllPayoutRequests: async (filter: PayoutFilter = {}): Promise<PageResponse<PayoutRequest>> => {
    try {
      return await http<PageResponse<PayoutRequest>>(`/api/admin/payouts${toQuery(filter)}`);
    } catch {
      return {
        items: [],
        page: filter.page ?? 1,
        size: filter.size ?? 20,
        totalElements: 0,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };
    }
  },

  updatePayoutRequestStatus: (requestId: string, body: UpdatePayoutRequestStatus) =>
    http<PayoutRequest>(`/api/admin/payouts/${requestId}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  getDashboardStats: async (month: MonthKey): Promise<AdminDashboardStats> => {
    try {
      const eventsPage = await catalogApi.getEvents({ size: 50 });
      return computeAdminDashboard(eventsPage.items, month);
    } catch {
      return emptyAdminDashboard(month);
    }
  },
};

// ── Payout (ví + rút tiền của Organizer) ─────────────────────────────────
export const payoutApi = {
  getWallet: () => http<OrganizerWallet>("/api/organizer/wallet"),

  createPayoutRequest: (body: CreatePayoutRequest) =>
    http<PayoutRequest>("/api/organizer/payouts", {
      method: "POST",
      body: JSON.stringify({ amount: body.amount }),
    }),

  getMyPayoutRequests: async (filter: PayoutFilter = {}): Promise<PageResponse<PayoutRequest>> => {
    const res = await http<
      PageResponse<
        PayoutRequest & {
          bankAccountNumber?: string;
          bankAccountHolder?: string;
          bankName?: string;
        }
      >
    >(`/api/organizer/payouts${toQuery(filter)}`);
    const items = (res.items ?? []).map((p) => ({
      ...p,
      bankAccount: p.bankAccount ?? {
        bankName: p.bankName ?? "",
        accountNumber: p.bankAccountNumber ?? "",
        accountHolderName: p.bankAccountHolder ?? "",
      },
    }));
    return { ...res, items };
  },
};

// ── Recommend ─────────────────────────────────────────────────────────────
export const recommendApi = {
  forYou: async (limit = 10): Promise<RecommendedEvent[]> => {
    try {
      return await http<RecommendedEvent[]>(`/api/recommendations/events/for-you?limit=${limit}`);
    } catch {
      return [];
    }
  },
  similar: async (eventId: string, limit = 5): Promise<RecommendedEvent[]> => {
    try {
      return await http<RecommendedEvent[]>(
        `/api/recommendations/events/${eventId}/similar?limit=${limit}`,
      );
    } catch {
      return [];
    }
  },
};

// ── Dashboard Helper Functions ──────────────────────────────────────────
function monthWeeks(month: MonthKey): DashboardWeek[] {
  const [year, mon] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year ?? 0, mon ?? 1, 0)).getUTCDate();
  const pad = (d: number) => String(d).padStart(2, "0");
  const weeks: DashboardWeek[] = [];
  for (let start = 1; start <= lastDay; start += 7) {
    weeks.push({
      weekStart: `${month}-${pad(start)}`,
      weekEnd: `${month}-${pad(Math.min(start + 6, lastDay))}`,
    });
  }
  return weeks;
}

function computeOrganizerDashboard(
  events: EventSummary[],
  month: MonthKey,
): OrganizerDashboardStats {
  const weeks = monthWeeks(month);
  return {
    month,
    summary: {
      netRevenue: 0,
      grossRevenue: 0,
      platformFee: 0,
      totalTicketsSold: 0,
      eventsHeld: events.filter((e) => e.status === "COMPLETED").length,
      upcomingEvents: events.filter((e) => e.status === "PUBLISHED").length,
    },
    revenueByWeek: weeks.map((w) => ({ ...w, revenue: 0, netRevenue: 0 })),
    topEvents: events.slice(0, 5).map((e) => ({
      eventId: e.id,
      eventTitle: e.title,
      ticketsSold: 0,
      revenue: 0,
    })),
  };
}

function emptyOrganizerDashboard(month: MonthKey): OrganizerDashboardStats {
  const weeks = monthWeeks(month);
  return {
    month,
    summary: {
      netRevenue: 0,
      grossRevenue: 0,
      platformFee: 0,
      totalTicketsSold: 0,
      eventsHeld: 0,
      upcomingEvents: 0,
    },
    revenueByWeek: weeks.map((w) => ({ ...w, revenue: 0, netRevenue: 0 })),
    topEvents: [],
  };
}

function computeAdminDashboard(events: EventSummary[], month: MonthKey): AdminDashboardStats {
  const weeks = monthWeeks(month);
  return {
    month,
    summary: {
      totalRevenue: 0,
      totalPlatformFee: 0,
      totalTicketsSold: 0,
      eventsHeld: events.filter((e) => e.status === "COMPLETED").length,
      newOrganizers: 0,
    },
    revenueByWeek: weeks.map((w) => ({ ...w, revenue: 0, platformFee: 0 })),
    topEvents: events.slice(0, 5).map((e) => ({
      eventId: e.id,
      eventTitle: e.title,
      organizerEmail: "",
      ticketsSold: 0,
      revenue: 0,
    })),
  };
}

function emptyAdminDashboard(month: MonthKey): AdminDashboardStats {
  const weeks = monthWeeks(month);
  return {
    month,
    summary: {
      totalRevenue: 0,
      totalPlatformFee: 0,
      totalTicketsSold: 0,
      eventsHeld: 0,
      newOrganizers: 0,
    },
    revenueByWeek: weeks.map((w) => ({ ...w, revenue: 0, platformFee: 0 })),
    topEvents: [],
  };
}
