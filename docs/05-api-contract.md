# 05 — API Contract

> Nguồn sự thật cho FE, dựa trên `../TicketBooking/docs/api-design.md` và code thật của backend (`ApiResponse`, `PageResponse`, `AuthController`, …).
> File code tương ứng: `src/types/api.ts`.

## 1. Quy ước chung

- Base path: `/api` (qua API Gateway `:8080`; FE gọi same-origin `/api/...` qua rewrite).
- JSON, thời gian ISO-8601 có offset (`2026-10-15T19:00:00+07:00`), tiền là `number` (VND, không thập phân).
- Phân trang: query `page` (**bắt đầu từ 1**), `size` (mặc định 20, tối đa 50), `sort=field,asc|desc`.
- Header: `Authorization: Bearer <accessToken>`, `X-Client-Type: WEB`; đặt vé khi có phòng chờ: `X-Queue-Token`.

### 1.1 Envelope

> `ApiResponse.status` **là HTTP status code thô** (200/400/401/403/404/409/429/500…), **không phải** mã lỗi tùy chỉnh dạng số riêng. Phân biệt lỗi nghiệp vụ dựa trên cặp `(HTTP status, message)` — xem mục 3.

```ts
export interface ApiResponse<T> {
  status: number; // = HTTP status code
  message: string; // tiếng Việt, dùng làm nội dung hiển thị chính
  data: T | null;
  errors?: Record<string, string>; // lỗi theo field (validation, vd { "email": "Email không đúng định dạng" })
  responseTime: number; // epoch ms của server → dùng bù lệch đồng hồ
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

## 2. Types & Endpoints

### 2.1 Enums

```ts
export type Role = "CUSTOMER" | "ORGANIZER" | "ADMIN";
export type AccountStatus = "PENDING" | "ACTIVE" | "LOCKED";
export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
export type BookingStatus = "PENDING_PAYMENT" | "PAID" | "CANCELLED" | "REFUNDED";
export type TicketStatus = "LOCKED" | "ISSUED" | "CANCELLED" | "CHECKED_IN";
export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
export type PaymentMethod = "MOMO";
export type SaleState = "NOT_STARTED" | "ON_SALE" | "ENDED" | "SOLD_OUT";
```

### 2.2 Auth

```ts
// RegisterRequest KHÔNG có `role` — endpoint public chỉ tạo CUSTOMER.
// Organizer không tự đăng ký (xem 04-auth-flow §3.3c).
export interface RegisterRequest {
  email: string;
  password: string;
} // password ≥ 6 ký tự
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
  refreshToken?: string; // chỉ MOBILE; WEB nhận qua cookie
  requirePasswordChange: boolean; // true khi tài khoản (Organizer) đăng nhập bằng mật khẩu tạm và chưa đổi — xem 04-auth-flow §3.3c
}

// currentPassword phải đúng mật khẩu hiện tại; newPassword ≥ 6 ký tự và phải khác
// currentPassword; confirmPassword phải khớp newPassword (kiểm tra cả 2 phía).
// Thành công ➔ server thu hồi TOÀN BỘ refresh token của tài khoản (kể cả phiên vừa
// gọi request này) và xóa cookie — client phải đăng nhập lại, xem 04-auth-flow §3.3c.
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Xác thực email — otp phải khớp CHÍNH XÁC regex 6 chữ số (`\d{6}`), sai định dạng
// (vd 5 số, có chữ) → 400 với errors.otp, KHÔNG phải lỗi "OTP sai".
export interface VerifyEmailRequest {
  email: string;
  otp: string;
}
export interface ResendVerificationRequest {
  email: string;
}
```

| Method | Path                            | Body                        | `data`                                                             | Quyền                                                       |
| ------ | ------------------------------- | --------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| POST   | `/api/auth/register`            | `RegisterRequest`           | `UserInfo` (201, `status: 'PENDING'`)                              | public                                                      |
| POST   | `/api/auth/verify-email`        | `VerifyEmailRequest`        | `AuthResponse` (tự động đăng nhập, `requirePasswordChange: false`) | public                                                      |
| POST   | `/api/auth/resend-verification` | `ResendVerificationRequest` | `null`                                                             | public (cooldown 60s — request thứ 2 trong cửa sổ đó → 429) |
| POST   | `/api/auth/login`               | `LoginRequest`              | `AuthResponse` + Set-Cookie (nếu `X-Client-Type: WEB`)             | public                                                      |
| POST   | `/api/auth/refresh`             | — (cookie)                  | `AuthResponse` + Set-Cookie                                        | public                                                      |
| POST   | `/api/auth/logout`              | —                           | `null`                                                             | auth                                                        |
| GET    | `/api/auth/account`             | —                           | `UserInfo`                                                         | auth                                                        |
| PUT    | `/api/auth/change-password`     | `ChangePasswordRequest`     | `null` + xóa cookie `refreshToken`                                 | auth                                                        |
| POST   | `/api/admin/organizers`         | xem §2.9                    | xem §2.9                                                           | ADMIN                                                       |

### 2.3 User

```ts
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
```

| Method | Path                   | Body                         | `data`          | Quyền |
| ------ | ---------------------- | ---------------------------- | --------------- | ----- |
| GET    | `/api/users/me`        | —                            | `Profile`       | auth  |
| PUT    | `/api/users/me`        | `UpdateProfileRequest`       | `Profile`       | auth  |
| POST   | `/api/users/me/avatar` | `multipart/form-data (file)` | `{ avatarUrl }` | auth  |

### 2.4 Catalog

```ts
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
  minPrice: number; // giá thấp nhất, để hiện "Từ 500.000đ"
  saleState: SaleState;
}

export interface EventDetail extends EventSummary {
  description: string | null;
  organizerId: string;
  ticketClasses: TicketClass[];
  // Phí nền tảng riêng cho sự kiện này — chỉ ADMIN sửa được, xem [11-payout-commission](11-payout-commission.md).
  commissionRate: number; // 0..1, mặc định 0.05
  flatFeePerTicket: number; // VND, mặc định 3000
}

export interface EventFilter {
  category?: string;
  keyword?: string;
  location?: string;
  startFrom?: string;
  startTo?: string; // yyyy-MM-dd
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
  // endpoint nhẹ để poll
  eventId: string;
  saleState: SaleState;
  ticketClasses: { id: string; availableQuantity: number }[]; // = available - hold_count
}

export interface TicketClassInput {
  id?: string; // có khi sửa
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
  ticketClasses: TicketClassInput[]; // ≥ 1
}
```

| Method | Path                                 | Body / Query                                                                                                                                              | `data`                                             | Quyền                          |
| ------ | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------ |
| GET    | `/api/categories`                    | —                                                                                                                                                         | `Category[]`                                       | public                         |
| GET    | `/api/events`                        | `EventFilter`                                                                                                                                             | `PageResponse<EventSummary>` (chỉ `PUBLISHED`)     | public                         |
| GET    | `/api/events/{eventId}`              | —                                                                                                                                                         | `EventDetail`                                      | public (DRAFT: chỉ chủ sở hữu) |
| GET    | `/api/events/{eventId}/availability` | —                                                                                                                                                         | `Availability`                                     | public                         |
| GET    | `/api/organizer/events`              | `page,size,status?`                                                                                                                                       | `PageResponse<EventSummary>` (của tôi, mọi status) | ORGANIZER                      |
| POST   | `/api/events`                        | `multipart/form-data`: part `data` = `UpsertEventRequest` (JSON, `Content-Type: application/json`), part `image` = banner (tùy chọn, JPEG/PNG/WEBP ≤ 5MB) | `EventDetail` (201, `DRAFT`)                       | ORGANIZER                      |
| PUT    | `/api/events/{eventId}`              | như POST; gửi `image` mới thì backend xóa banner cũ rồi lưu ảnh mới, không gửi thì giữ banner                                                             | `EventDetail`                                      | ORGANIZER (chủ)                |
| PATCH  | `/api/events/{eventId}/publish`      | —                                                                                                                                                         | `EventDetail`                                      | ORGANIZER (chủ)                |

Quy tắc sửa: sự kiện `PUBLISHED` **không được** giảm `totalQuantity` xuống dưới số đã bán, không xóa hạng vé đã có đơn.

### 2.5 Booking

```ts
export interface CreateBookingRequest {
  eventId: string;
  items: { ticketClassId: string; quantity: number }[]; // tổng quantity 1..10
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
  qrCodeData: string; // chỉ trả khi status ISSUED/CHECKED_IN
  status: TicketStatus;
  checkedInAt: string | null;
}

export interface Booking {
  id: string;
  event: Pick<EventSummary, "id" | "title" | "bannerUrl" | "startTime" | "location">; // nhúng sẵn để khỏi gọi thêm
  status: BookingStatus;
  totalAmount: number;
  quantity: number;
  items: BookingItem[];
  tickets: Ticket[]; // rỗng khi PENDING_PAYMENT
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
} // eventId: chặn quét vé sự kiện khác
export interface CheckInResult {
  ticketId: string;
  ticketClass: string;
  eventTitle: string;
  customerName: string;
  status: "CHECKED_IN";
  checkedInAt: string;
}
```

| Method | Path                        | Body / Query                                             | `data`                  | Quyền                                     |
| ------ | --------------------------- | -------------------------------------------------------- | ----------------------- | ----------------------------------------- |
| POST   | `/api/bookings`             | `CreateBookingRequest` (+ `X-Queue-Token` nếu queue bật) | `Booking` (201)         | CUSTOMER                                  |
| GET    | `/api/bookings/{bookingId}` | —                                                        | `Booking`               | CUSTOMER (chủ)                            |
| GET    | `/api/bookings/me`          | `BookingFilter`                                          | `PageResponse<Booking>` | CUSTOMER                                  |
| DELETE | `/api/bookings/{bookingId}` | —                                                        | `Booking` (`CANCELLED`) | CUSTOMER (chủ, chỉ khi `PENDING_PAYMENT`) |
| POST   | `/api/bookings/check-in`    | `CheckInRequest`                                         | `CheckInResult`         | ORGANIZER (chủ sự kiện)                   |

### 2.6 Payment

```ts
export interface InitiatePaymentRequest {
  bookingId: string;
  paymentMethod: PaymentMethod;
  returnUrl: string; // `${NEXT_PUBLIC_APP_URL}/payment/result`
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
```

| Method | Path                     | Body / Query             | `data`                      | Quyền                          |
| ------ | ------------------------ | ------------------------ | --------------------------- | ------------------------------ |
| POST   | `/api/payments/initiate` | `InitiatePaymentRequest` | `InitiatePaymentResponse`   | CUSTOMER                       |
| GET    | `/api/payments/history`  | `page,size`              | `PageResponse<Transaction>` | CUSTOMER                       |
| GET    | `/api/payments/momo/ipn` | (MoMo gọi — IPN)         | —                           | server-to-server, FE không gọi |

Cổng thanh toán thật là **MoMo** (không phải VNPay) — xem `../TicketBooking/docs/api-design.md` §5. MoMo redirect người dùng về `returnUrl?partnerCode=MOMO&orderId=…&requestId=…&amount=…&orderInfo=…&orderType=…&transId=…&resultCode=…&message=…&payType=…&responseTime=…&extraData=…&signature=…`. FE **không tin** `resultCode` trong query để kết luận (redirect trình duyệt có thể bị giả mạo); chỉ dùng để hiển thị gợi ý tạm, trạng thái cuối cùng lấy từ `GET /api/bookings/{id}`. `orderId` map thẳng ra `bookingId` (backend gửi `orderId = bookingId` khi tạo giao dịch với MoMo), hoặc FE lưu `bookingId` vào `sessionStorage` trước khi redirect làm dự phòng.

### 2.7 Queue

```ts
export interface QueueStatus {
  eventId: string;
  queueEnabled: boolean;
  totalWaiting: number;
  estimatedWaitTimeSeconds: number;
}

// WebSocket STOMP — server → client (destination /user/queue/position)
export type QueueMessage =
  | {
      type: "POSITION_UPDATE";
      position: number;
      totalWaiting: number;
      estimatedWaitSeconds: number;
    }
  | { type: "ADMITTED"; accessToken: string; expiresInSeconds: number }
  | { type: "REMOVED"; reason: "HEARTBEAT_TIMEOUT" | "LEFT" | "EVENT_CLOSED" };
```

| Method | Path                                                                          | `data`        | Quyền    |
| ------ | ----------------------------------------------------------------------------- | ------------- | -------- |
| GET    | `/api/queue/events/{eventId}/status`                                          | `QueueStatus` | public   |
| WS     | `NEXT_PUBLIC_WS_URL` (STOMP) — chi tiết [07-waiting-room](07-waiting-room.md) |               | CUSTOMER |

### 2.8 Organizer report

```ts
export interface EventReport {
  eventId: string;
  eventTitle: string;
  summary: {
    totalRevenue: number; // gross — tổng tiền khách trả
    totalPlatformFee: number; // Σ (giá vé × commissionRate + flatFeePerTicket), vé 0đ không tính — xem 11-payout-commission
    netRevenue: number; // totalRevenue - totalPlatformFee — số cộng vào ví Organizer
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
```

| Method | Path                                     | `data`        | Quyền           |
| ------ | ---------------------------------------- | ------------- | --------------- |
| GET    | `/api/organizer/events/{eventId}/report` | `EventReport` | ORGANIZER (chủ) |

### 2.9 Admin

```ts
export interface AccountSummary {
  id: string;
  email: string;
  role: Role;
  status: AccountStatus;
  createdAt: string;
}

// Field tên `account` (không phải AccountSummary đầy đủ — chỉ UserInfo: id/email/role/status, KHÔNG có createdAt).
export interface AdminCreateOrganizerRequest {
  email: string;
  fullName: string;
}
export interface AdminCreateOrganizerResponse {
  account: UserInfo;
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
```

| Method | Path                                     | Body / Query                                      | `data`                                                                | Quyền |
| ------ | ---------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------- | ----- |
| GET    | `/api/admin/organizers`                  | `status? ('ACTIVE'\|'LOCKED'),page,size,keyword?` | `PageResponse<AccountSummary>`                                        | ADMIN |
| POST   | `/api/admin/organizers`                  | `AdminCreateOrganizerRequest`                     | `AdminCreateOrganizerResponse` (201, `account.status: 'ACTIVE'` ngay) | ADMIN |
| PATCH  | `/api/admin/accounts/{accountId}/status` | `UpdateAccountStatusRequest`                      | `AccountSummary`                                                      | ADMIN |
| POST   | `/api/admin/categories`                  | `UpsertCategoryRequest`                           | `Category` (201)                                                      | ADMIN |
| PUT    | `/api/admin/categories/{id}`             | `UpsertCategoryRequest`                           | `Category`                                                            | ADMIN |
| DELETE | `/api/admin/categories/{id}`             | —                                                 | `null` (409 nếu còn sự kiện)                                          | ADMIN |

> Mật khẩu tạm (ngẫu nhiên, 12 ký tự) do server sinh và **chỉ gửi qua email** cho Organizer (Kafka `auth.organizer-created` → notification-service). Response **không** chứa mật khẩu — Admin không bao giờ thấy nó; server chỉ lưu bản hash. UI chỉ báo "đã gửi mật khẩu tạm tới email …".

### 2.9b Payout — Ví & rút tiền Organizer

> Chi tiết đầy đủ (công thức phí, state machine payout, wireframe): [11-payout-commission](11-payout-commission.md).

| Method | Path                                     | Body / Query                   | `data`                                                       | Quyền     |
| ------ | ---------------------------------------- | ------------------------------ | ------------------------------------------------------------ | --------- |
| GET    | `/api/admin/events`                      | `AdminEventFilter`             | `PageResponse<EventSummary>` (mọi Organizer, mọi trạng thái) | ADMIN     |
| PATCH  | `/api/admin/events/{eventId}/commission` | `UpdateEventCommissionRequest` | `EventDetail`                                                | ADMIN     |
| GET    | `/api/organizer/wallet`                  | —                              | `OrganizerWallet`                                            | ORGANIZER |
| POST   | `/api/organizer/payouts`                 | `CreatePayoutRequest`          | `PayoutRequest` (201)                                        | ORGANIZER |
| GET    | `/api/organizer/payouts`                 | `PayoutFilter`                 | `PageResponse<PayoutRequest>` (của tôi)                      | ORGANIZER |
| GET    | `/api/admin/payouts`                     | `PayoutFilter`                 | `PageResponse<PayoutRequest>` (mọi Organizer)                | ADMIN     |
| PATCH  | `/api/admin/payouts/{requestId}/status`  | `UpdatePayoutRequestStatus`    | `PayoutRequest`                                              | ADMIN     |

### 2.10 Recommend

```ts
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
```

| Method | Path                                                    | `data`               | Quyền    |
| ------ | ------------------------------------------------------- | -------------------- | -------- |
| GET    | `/api/recommendations/events/for-you?limit=10`          | `RecommendedEvent[]` | CUSTOMER |
| GET    | `/api/recommendations/events/{eventId}/similar?limit=5` | `RecommendedEvent[]` | public   |

Recommend lỗi/timeout → FE **ẩn block**, không báo lỗi (tính năng phụ).

## 3. Xử lý lỗi

> `ApiResponse.status` không mang mã lỗi tùy chỉnh — mọi lỗi chỉ có HTTP status thô + `message` chuỗi tiếng Việt. Phân biệt lỗi nghiệp vụ dựa trên cặp `(HTTP status, message)`.

### 3.1 Hệ quả cho FE

- **Không `switch` theo mã lỗi số** — chỉ có 2 tín hiệu để phân loại: **HTTP status** (400/401/403/404/409/410/429/500) và **nội dung `message`**.
- Nhiều lỗi nghiệp vụ khác nhau có thể **trùng HTTP status** (ví dụ hết vé và không đủ số lượng đều là `409`).
- Cách xử lý: **so khớp theo tiền tố/từ khóa cố định trong `message`** (case-insensitive, dùng hằng số tập trung ở `lib/error-messages.ts`, viết test snapshot để phát hiện sớm nếu backend đổi câu chữ) — áp dụng cho lỗi login ở [04-auth-flow §3.3b](04-auth-flow.md).

### 3.2 Bảng tra theo HTTP status (auth)

| HTTP status | Khi nào gặp                                                                                                                                                                                                      | UI                                                                                                                                                                                                                                                                                                         |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 400         | Validation lỗi field (email sai định dạng, password ngắn hơn 6, OTP không đúng 6 chữ số, `newPassword` ≠ `confirmPassword`, `newPassword` trùng `currentPassword`)                                               | Có `errors` → gán vào field; không có → toast `message`                                                                                                                                                                                                                                                    |
| 401         | **3 tình huống khác nhau, cùng 401:** (a) sai email/mật khẩu lúc login/đổi mật khẩu; (b) tài khoản `LOCKED` hoặc Customer `PENDING` chưa xác thực, lúc login; (c) access token hết hạn/thiếu ở API cần đăng nhập | **(c)** phân biệt được: request đó có gắn `Authorization` header → tự refresh. **(a) và (b)** chỉ xảy ra ở chính request `/login` (không có `Authorization` header) → **không tự refresh**, luôn hiện lỗi ngay dưới form; phân biệt (a) với (b) bằng `message` — xem [04-auth-flow §3.3b](04-auth-flow.md) |
| 403         | Thiếu quyền (`@PreAuthorize` fail — vd CUSTOMER gọi API dành cho ADMIN)                                                                                                                                          | Trang `/403`                                                                                                                                                                                                                                                                                               |
| 404         | Tài khoản/route không tồn tại                                                                                                                                                                                    | `notFound()` hoặc toast tùy ngữ cảnh                                                                                                                                                                                                                                                                       |
| 409         | Email đã tồn tại lúc register/tạo Organizer; tài khoản đã xác thực rồi mà gọi lại verify-email/resend-verification                                                                                               | Gán lỗi field `email` nếu ngữ cảnh form đăng ký; toast nếu ngữ cảnh khác                                                                                                                                                                                                                                   |
| 429         | Gọi `resend-verification` quá nhanh (cooldown 60s)                                                                                                                                                               | Disable nút, hiện đếm ngược                                                                                                                                                                                                                                                                                |
| 500         | Lỗi không lường trước                                                                                                                                                                                            | Toast chung "Có lỗi xảy ra, thử lại sau"                                                                                                                                                                                                                                                                   |

### 3.3 Bảng tra theo HTTP status (booking/payment/catalog/queue)

| HTTP status | Tình huống nghiệp vụ                   | `message`                                                       | UI                                                               |
| ----------- | -------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- |
| 404         | Sự kiện/hạng vé/đơn hàng không tồn tại | "Sự kiện không tồn tại." / …                                    | `notFound()`                                                     |
| 409         | Hạng vé hết vé hoàn toàn               | "Hạng vé này đã hết vé."                                        | Refetch availability, đánh dấu hạng vé hết                       |
| 409         | Không đủ số lượng yêu cầu              | "Chỉ còn N vé." (kèm `errors.quantity` hoặc số N trong message) | Parse N từ message hoặc refetch availability để lấy số chính xác |
| 409         | Sự kiện chưa/đã đóng bán               | "Sự kiện chưa mở bán." / "Sự kiện đã đóng bán."                 | Refetch event, cập nhật nút theo `saleState`                     |
| 429         | Đặt vé quá nhanh                       | "Đặt vé quá nhanh, vui lòng thử lại."                           | Disable nút 5s                                                   |
| 410         | Giữ chỗ hết hạn                        | "Thời gian giữ vé đã hết hạn."                                  | Dialog "Hết thời gian giữ chỗ"                                   |
| 403         | Queue token sai/hết hạn                | "Token phòng chờ không hợp lệ hoặc đã hết hạn."                 | Xóa queue token → về `/queue/{eventId}`                          |
| 409         | Vé đã check-in trước đó                | "Vé đã được check-in trước đó."                                 | Check-in: màn đỏ + giờ check-in cũ                               |
| 409         | Vé chưa phát hành (chưa thanh toán)    | "Vé chưa được phát hành."                                       | Check-in: "Vé chưa thanh toán"                                   |
