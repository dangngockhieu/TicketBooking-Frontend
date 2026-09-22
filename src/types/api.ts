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
  /**
   * Phí nền tảng thu trên mỗi vé bán được: phí = giá vé × commissionRate +
   * flatFeePerTicket (vé giá 0đ luôn miễn phí, không tính flatFeePerTicket).
   * Mặc định 5% + 3.000đ khi tạo sự kiện; chỉ ADMIN sửa được (đàm phán riêng
   * từng sự kiện) — Organizer chỉ xem, không sửa. Không áp dụng bậc thang
   * theo GMV: cùng một công thức cố định cho mọi mức giá, giống Ticketbox/
   * Eventbrite thực tế (8.5%+20.000đ, 3.7%+$1.79).
   */
  commissionRate: number; // 0..1, vd 0.05 = 5%
  flatFeePerTicket: number; // VND, vd 3000
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

/** Admin xem mọi sự kiện của mọi Organizer, mọi trạng thái — dùng để cấu hình phí. */
export interface AdminEventFilter {
  status?: EventStatus;
  keyword?: string;
  page?: number;
  size?: number;
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
    totalRevenue: number; // gross — tổng tiền khách trả
    totalPlatformFee: number; // = Σ (giá vé × commissionRate + flatFeePerTicket), vé 0đ không tính
    netRevenue: number; // = totalRevenue - totalPlatformFee — số cộng vào ví Organizer
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

// ── Admin dashboard ───────────────────────────────────────────────────────
export type DashboardPeriod = "WEEK" | "MONTH";

export interface AdminDashboardStats {
  period: DashboardPeriod;
  rangeStart: string;
  rangeEnd: string;
  summary: {
    totalRevenue: number; // gross toàn hệ thống trong kỳ
    totalPlatformFee: number; // doanh thu của nền tảng (hoa hồng) trong kỳ
    totalTicketsSold: number;
    eventsHeld: number; // số sự kiện có startTime rơi trong kỳ (đã/đang diễn ra)
    newOrganizers: number;
  };
  revenueByDay: { date: string; revenue: number; platformFee: number }[];
  topEvents: {
    eventId: string;
    eventTitle: string;
    organizerEmail: string;
    ticketsSold: number;
    revenue: number;
  }[];
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

/** Admin sửa phí nền tảng riêng cho một sự kiện — xem ghi chú ở EventDetail. */
export interface UpdateEventCommissionRequest {
  commissionRate: number;
  flatFeePerTicket: number;
}

// ── Payout (ví + rút tiền của Organizer) ─────────────────────────────────
/**
 * Mô hình theo Ticketbox/Eventbrite: tiền tự động về trong vòng 7 ngày sau
 * event.endTime (job nền tự tạo payout PENDING, source=AUTO) — Organizer
 * không cần chủ động xin, nhưng vẫn có thể xin rút sớm hơn lịch nếu cần gấp
 * (source=MANUAL). Admin có thể HOLD bất kỳ payout nào (kể cả đã APPROVED)
 * khi nghi ngờ gian lận/khiếu nại, chặn không cho nó tiếp tục cho tới khi
 * điều tra xong rồi mở lại.
 */
export type PayoutRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID" | "HOLD";
export type PayoutSource = "AUTO" | "MANUAL";

export interface OrganizerWallet {
  /** Tổng netRevenue cộng dồn từ mọi event COMPLETED, trừ các payout đã PAID/APPROVED/PENDING/HOLD. */
  availableBalance: number;
  /** Tổng đang chờ duyệt/đã duyệt/tạm giữ nhưng chưa PAID — trừ tạm khỏi availableBalance. */
  pendingPayout: number;
  totalWithdrawn: number; // tổng đã PAID từ trước tới nay
  updatedAt: string;
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}

export interface PayoutRequest {
  id: string;
  organizerId: string;
  organizerEmail: string;
  amount: number;
  bankAccount: BankAccount;
  status: PayoutRequestStatus;
  source: PayoutSource;
  eventId?: string | null; // gắn với 1 event nếu source=AUTO (payout theo lịch của event đó)
  eventTitle?: string | null;
  /** Lý do khi REJECTED hoặc HOLD. */
  reason?: string | null;
  createdAt: string;
  processedAt: string | null;
}

export interface CreatePayoutRequest {
  amount: number;
  bankAccount: BankAccount;
}

export interface UpdatePayoutRequestStatus {
  status: Extract<PayoutRequestStatus, "APPROVED" | "REJECTED" | "PAID" | "HOLD" | "PENDING">;
  reason?: string;
}

export interface PayoutFilter {
  status?: PayoutRequestStatus;
  page?: number;
  size?: number;
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
