# 11 — Phí nền tảng (hoa hồng) & Ví/Payout Organizer

> Nguồn: code FE hiện tại (`src/types/api.ts`, `src/lib/fake-api.ts`, `src/features/organizer/*`, `src/features/admin/*`). Mảng nghiệp vụ này **chưa có trong `api-design.md` gốc của backend** — cần đối chiếu/thống nhất với backend trước khi implement thật (xem §5).

## 1. Phí nền tảng (Platform commission)

Mô hình theo Ticketbox/Eventbrite thực tế: **một công thức cố định cho mọi mức giá**, không có bậc thang theo GMV.

```
phí/vé = giá vé × commissionRate + flatFeePerTicket
```

- `commissionRate`: tỷ lệ phần trăm (0..1, vd `0.05` = 5%).
- `flatFeePerTicket`: phí cố định mỗi vé (VND, vd `3000`).
- **Vé giá 0đ luôn được miễn phí hoàn toàn** — không tính `flatFeePerTicket` (khớp thực tế: vé mời/vé thiện nguyện không nên bị trừ phí cố định).
- Mặc định khi tạo sự kiện: **5% + 3.000đ/vé**.
- Chỉ **ADMIN** sửa được `commissionRate`/`flatFeePerTicket`, và sửa **riêng theo từng sự kiện** (đàm phán với đối tác lớn, miễn phí sự kiện thiện nguyện…) — Organizer chỉ xem, không sửa.

```ts
// EventDetail (mở rộng so với EventSummary)
export interface EventDetail extends EventSummary {
  // …
  commissionRate: number; // 0..1
  flatFeePerTicket: number; // VND
}

export interface UpdateEventCommissionRequest {
  commissionRate: number;
  flatFeePerTicket: number;
}
```

| Method | Path                                     | Body                                                   | `data`                                                       | Quyền |
| ------ | ---------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------ | ----- |
| GET    | `/api/admin/events`                      | `AdminEventFilter { status?, keyword?, page?, size? }` | `PageResponse<EventSummary>` (mọi Organizer, mọi trạng thái) | ADMIN |
| PATCH  | `/api/admin/events/{eventId}/commission` | `UpdateEventCommissionRequest`                         | `EventDetail`                                                | ADMIN |

> Path `PATCH /api/admin/events/{eventId}/commission` là **suy ra từ UI**, chưa xác nhận với backend — xem §5.

### Ảnh hưởng lên báo cáo doanh thu (`EventReport`, xem [05-api-contract §2.8](05-api-contract.md#28-organizer-report))

```ts
summary: {
  totalRevenue: number; // gross — tổng tiền khách trả
  totalPlatformFee: number; // Σ (giá vé × commissionRate + flatFeePerTicket), vé 0đ không tính
  netRevenue: number; // totalRevenue - totalPlatformFee — số cộng vào ví Organizer
  totalTicketsSold: number;
  totalTicketsCheckedIn: number;
  checkInRate: number;
}
```

## 2. Ví Organizer & rút tiền (Payout)

Cũng theo mô hình Ticketbox/Eventbrite: **tiền tự động chuyển về Organizer** sau một khoảng thời gian kể từ khi sự kiện kết thúc (không cần Organizer chủ động xin), nhưng Organizer vẫn có thể **xin rút sớm hơn** nếu cần gấp.

```
Event.endTime ──► (7 ngày) ──► job nền tạo PayoutRequest { status: PENDING, source: AUTO }
                                              │
                                    Admin duyệt (APPROVED)
                                              │
                              Admin tự chuyển khoản NGOÀI hệ thống
                                              │
                                  Admin đánh dấu (PAID)

Organizer xin rút sớm hơn lịch ──► PayoutRequest { status: PENDING, source: MANUAL }
                                              │
                                (giống luồng trên: APPROVED → PAID)

Bất kỳ lúc nào (trừ đã PAID/REJECTED): Admin có thể HOLD (tạm giữ, nghi ngờ gian lận/khiếu nại)
                                              │
                                  Admin mở lại → PENDING
```

- **Không có tích hợp chuyển khoản tự động** (không phải payment gateway payout) — Admin tự thao tác chuyển khoản ngân hàng ngoài hệ thống rồi bấm "Đã chuyển khoản" để đóng yêu cầu.
- `REJECTED`/`HOLD` **bắt buộc nhập lý do** (`reason`) — cần lưu vết cho quyết định nhạy cảm về tiền.
- `PAID` là trạng thái cuối, không đổi được nữa.

```ts
export type PayoutRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID" | "HOLD";
export type PayoutSource = "AUTO" | "MANUAL";

export interface OrganizerWallet {
  availableBalance: number; // Σ netRevenue từ mọi event COMPLETED, trừ pending/approved/hold/paid
  pendingPayout: number; // Σ PENDING + APPROVED + HOLD (đã trừ tạm khỏi availableBalance)
  totalWithdrawn: number; // Σ PAID
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
  eventId?: string | null; // gắn 1 event nếu source=AUTO
  eventTitle?: string | null;
  reason?: string | null; // bắt buộc khi REJECTED hoặc HOLD
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
```

| Method | Path                                    | Body / Query                | `data`                                                     | Quyền     |
| ------ | --------------------------------------- | --------------------------- | ---------------------------------------------------------- | --------- |
| GET    | `/api/organizer/wallet`                 | —                           | `OrganizerWallet`                                          | ORGANIZER |
| POST   | `/api/organizer/payouts`                | `CreatePayoutRequest`       | `PayoutRequest` (201, `status: PENDING`, `source: MANUAL`) | ORGANIZER |
| GET    | `/api/organizer/payouts`                | `PayoutFilter`              | `PageResponse<PayoutRequest>` (của tôi)                    | ORGANIZER |
| GET    | `/api/admin/payouts`                    | `PayoutFilter`              | `PageResponse<PayoutRequest>` (mọi Organizer)              | ADMIN     |
| PATCH  | `/api/admin/payouts/{requestId}/status` | `UpdatePayoutRequestStatus` | `PayoutRequest`                                            | ADMIN     |

> Toàn bộ path trên là **suy ra từ UI hiện tại**, chưa xác nhận với backend — xem §5.

### Validate khi tạo yêu cầu rút tiền

| Điều kiện                           | Lỗi                                                      |
| ----------------------------------- | -------------------------------------------------------- |
| `amount > wallet.availableBalance`  | 409 "Số tiền yêu cầu vượt quá số dư khả dụng."           |
| `amount <= 0`                       | 400 "Số tiền rút phải lớn hơn 0."                        |
| Đổi trạng thái một payout đã `PAID` | 409 "Yêu cầu đã chi trả, không thể thay đổi trạng thái." |

## 3. Màn hình

| Route               | Vai trò   | Nội dung                                                                                                                                                                        |
| ------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/organizer/wallet` | ORGANIZER | 3 thẻ (số dư khả dụng / đang chờ xử lý / đã rút), nút "Yêu cầu rút tiền" (dialog nhập số tiền + tài khoản ngân hàng), bảng lịch sử yêu cầu                                      |
| `/admin/events`     | ADMIN     | Danh sách mọi sự kiện (mọi Organizer), cột hiển thị công thức phí hiện tại, nút "Sửa phí" mở dialog `commissionRate` (%) + `flatFeePerTicket` (VNĐ)                             |
| `/admin/payouts`    | ADMIN     | Tabs theo trạng thái, bảng yêu cầu rút tiền kèm hành động theo trạng thái hiện tại (Duyệt/Từ chối khi `PENDING`, Đã chuyển khoản khi `APPROVED`, Tạm giữ/Mở lại tùy trạng thái) |

Component liên quan: `EventCommissionDialog`, `RequestPayoutDialog`, `PayoutActionDialog`, `PayoutStatusBadge`.

## 4. Badge trạng thái Payout

| Giá trị    | Nhãn       | Màu     |
| ---------- | ---------- | ------- |
| `PENDING`  | Chờ duyệt  | warning |
| `APPROVED` | Đã duyệt   | info    |
| `PAID`     | Đã chi trả | success |
| `REJECTED` | Đã từ chối | danger  |
| `HOLD`     | Tạm giữ    | danger  |

## 5. Cần thống nhất với backend

Mảng nghiệp vụ này được code trước ở FE (fake data), **chưa có trong** `../TicketBooking/docs/api-design.md` gốc. Trước khi implement thật ở backend, cần chốt:

1. Service nào sở hữu dữ liệu commission/payout — mở rộng `catalog-service` (vì gắn với `events`) hay tách `payment-service`/service mới?
2. Đường dẫn API chính xác (bảng trên là suy đoán theo REST convention, không phải đặc tả đã duyệt).
3. Job nền tính payout `AUTO` sau 7 ngày kể từ `event.endTime` — chạy ở service nào, có dùng Kafka/scheduler không.
4. `OrganizerWallet.availableBalance` tính theo sự kiện `COMPLETED` — ai/khi nào chuyển `event.status` sang `COMPLETED` (job nền theo `endTime`, hay Organizer/Admin thao tác tay)?
5. Có cần audit log riêng cho thao tác duyệt/từ chối/tạm giữ payout (ai duyệt, lúc nào) ngoài `reason` hay không.
