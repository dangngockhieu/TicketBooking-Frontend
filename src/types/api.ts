/**
 * Nguồn sự thật cho kiểu dữ liệu API — theo docs/05-api-contract.md.
 * Dùng chung bởi src/lib/api.ts (thật) và src/lib/fake-api.ts (giả).
 * Khi backend đổi contract: cập nhật doc → file này → fake-api.ts → UI.
 */

// ── Envelope ──────────────────────────────────────────────────────────────
// ApiResponse.status LÀ HTTP status code thô (200/400/401/...), không phải mã lỗi riêng.
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T | null;
  errors?: Record<string, string>;
  responseTime: number; // epoch ms server — dùng bù lệch đồng hồ
}

export interface PageResponse<T> {
  items: T[];
  page: number; // bắt đầu từ 1
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export class ApiError extends Error {
  constructor(
    public httpStatus: number,
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Enums ─────────────────────────────────────────────────────────────────
export type Role = "CUSTOMER" | "ORGANIZER" | "ADMIN";
export type AccountStatus = "PENDING" | "ACTIVE" | "LOCKED";
export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
export type BookingStatus = "PENDING_PAYMENT" | "PAID" | "CANCELLED" | "REFUNDED";
export type TicketStatus = "LOCKED" | "ISSUED" | "CANCELLED" | "CHECKED_IN";
export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
export type PaymentMethod = "VNPAY";
export type SaleState = "NOT_STARTED" | "ON_SALE" | "ENDED" | "SOLD_OUT";

// ── Auth ──────────────────────────────────────────────────────────────────
export interface RegisterRequest {
  email: string;
  password: string;
}
export interface LoginRequest {
  email: string;
  password: string;
}
export interface UserInfo {
  id: string;
  email: string;
  role: Role;
  status: AccountStatus;
}
export interface AuthResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number; // giây
  user: UserInfo;
  refreshToken?: string; // chỉ MOBILE
  requirePasswordChange: boolean;
}
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
export interface VerifyEmailRequest {
  email: string;
  otp: string;
}
export interface ResendVerificationRequest {
  email: string;
}

// ── User ──────────────────────────────────────────────────────────────────
export interface Profile {
  id: string;
  accountId: string;
  email: string;
  role: Role;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
}
export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber?: string | null;
}

// ── Catalog ───────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface TicketClass {
  id: string;
  name: string;
  description: string | null;
  price: number;
  totalQuantity: number;
  availableQuantity: number;
  sortOrder: number;
}

export interface EventSummary {
  id: string;
  title: string;
  category: Pick<Category, "id" | "name" | "slug">;
  location: string;
  venueName: string | null;
  bannerUrl: string | null;
  startTime: string;
  endTime: string;
  saleStartTime: string | null;
  saleEndTime: string | null;
  status: EventStatus;
  minPrice: number;
  saleState: SaleState;
}

export interface EventDetail extends EventSummary {
  description: string | null;
  organizerId: string;
  ticketClasses: TicketClass[];
}

export interface EventFilter {
  category?: string;
  keyword?: string;
  location?: string;
  startFrom?: string;
  startTo?: string;
  page?: number;
  size?: number;
  sort?: "startTime,asc" | "startTime,desc";
}

export interface Availability {
  eventId: string;
  saleState: SaleState;
  ticketClasses: { id: string; availableQuantity: number }[];
}

export interface TicketClassInput {
  id?: string;
  name: string;
  description?: string | null;
  price: number;
  totalQuantity: number;
  sortOrder?: number;
}
export interface UpsertEventRequest {
  categoryId: string;
  title: string;
  description?: string | null;
  location: string;
  venueName?: string | null;
  bannerUrl?: string | null;
  startTime: string;
  endTime: string;
  saleStartTime: string;
  saleEndTime: string;
  ticketClasses: TicketClassInput[];
}

// ── Booking ───────────────────────────────────────────────────────────────
export interface CreateBookingRequest {
  eventId: string;
  items: { ticketClassId: string; quantity: number }[];
}

export interface BookingItem {
  ticketClassId: string;
  ticketClassName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Ticket {
  id: string;
  ticketClassId: string;
  ticketClassName: string;
  qrCodeData: string;
  status: TicketStatus;
  checkedInAt: string | null;
}

export interface Booking {
  id: string;
  event: Pick<EventSummary, "id" | "title" | "bannerUrl" | "startTime" | "location">;
  status: BookingStatus;
  totalAmount: number;
  quantity: number;
  items: BookingItem[];
  tickets: Ticket[];
  expiredAt: string;
  createdAt: string;
}

export interface BookingFilter {
  status?: BookingStatus;
  page?: number;
  size?: number;
}

export interface CheckInRequest {
  qrCodeData: string;
  eventId: string;
}
export interface CheckInResult {
  ticketId: string;
  ticketClass: string;
  eventTitle: string;
  customerName: string;
  status: "CHECKED_IN";
  checkedInAt: string;
}

// ── Payment ───────────────────────────────────────────────────────────────
export interface InitiatePaymentRequest {
  bookingId: string;
  paymentMethod: PaymentMethod;
  returnUrl: string;
}
export interface InitiatePaymentResponse {
  transactionId: string;
  paymentUrl: string;
  expiredAt: string;
}

export interface Transaction {
  id: string;
  bookingId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  gatewayTransId: string | null;
  paidAt: string | null;
  createdAt: string;
}

// ── Queue ─────────────────────────────────────────────────────────────────
export interface QueueStatus {
  eventId: string;
  queueEnabled: boolean;
  totalWaiting: number;
  estimatedWaitTimeSeconds: number;
}

export type QueueMessage =
  | {
      type: "POSITION_UPDATE";
      position: number;
      totalWaiting: number;
      estimatedWaitSeconds: number;
    }
  | { type: "ADMITTED"; accessToken: string; expiresInSeconds: number }
  | { type: "REMOVED"; reason: "HEARTBEAT_TIMEOUT" | "LEFT" | "EVENT_CLOSED" };

// ── Organizer report ──────────────────────────────────────────────────────
export interface EventReport {
  eventId: string;
  eventTitle: string;
  summary: {
    totalRevenue: number;
    totalTicketsSold: number;
    totalTicketsCheckedIn: number;
    checkInRate: number;
  };
  byTicketClass: {
    ticketClassId: string;
    name: string;
    price: number;
    totalQuantity: number;
    sold: number;
    checkedIn: number;
    revenue: number;
  }[];
  salesByDay?: { date: string; sold: number; revenue: number }[];
}

// ── Admin ─────────────────────────────────────────────────────────────────
export interface AccountSummary {
  id: string;
  email: string;
  role: Role;
  status: AccountStatus;
  createdAt: string;
}
export interface AdminCreateOrganizerRequest {
  email: string;
  fullName: string;
}
export interface AdminCreateOrganizerResponse {
  account: UserInfo;
  tempPassword: string;
}
export interface UpdateAccountStatusRequest {
  status: Extract<AccountStatus, "ACTIVE" | "LOCKED">;
  reason?: string;
}
export interface UpsertCategoryRequest {
  name: string;
  slug: string;
  description?: string | null;
}

// ── Recommend ─────────────────────────────────────────────────────────────
export interface RecommendedEvent {
  eventId: string;
  title: string;
  categoryName: string;
  matchScore: number;
  reasons: string[];
  bannerUrl?: string | null;
  startTime?: string;
  minPrice?: number;
}
