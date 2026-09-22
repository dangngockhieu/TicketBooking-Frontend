# 07 — Booking & Payment Flow (UC-C4 → C7)

## 1. Luồng tổng

```
/events/[id]                               (chưa login → /login?next=/events/[id])
  │ chọn số lượng từng hạng vé → [Mua vé]
  ▼
GET /api/queue/events/{id}/status
  ├─ queueEnabled && chưa có queue token hợp lệ ──► /queue/[id]  ──ADMITTED──┐
  └─ không bật queue ─────────────────────────────────────────────────────────┤
                                                                               ▼
POST /api/bookings  { eventId, items }  (+ X-Queue-Token)
  ├─ 201 → /checkout/[bookingId]
  └─ lỗi → xem §4
  ▼
/checkout/[bookingId]   ⏱ đếm ngược tới expiredAt
  ├─ [Hủy đơn] → DELETE /api/bookings/{id} → về /events/[id]
  ├─ hết giờ → dialog "Hết thời gian giữ chỗ"
  └─ [Thanh toán] → POST /api/payments/initiate → sessionStorage.lastBookingId = id
                    → window.location.assign(paymentUrl)   (VNPay / VNPay giả)
  ▼
/payment/result?vnp_TxnRef=…&vnp_ResponseCode=…
  → bookingId = vnp_TxnRef ?? sessionStorage.lastBookingId
  → poll GET /api/bookings/{id} mỗi 2s, tối đa 60s
       PAID      → ✅ thành công → [Xem vé] /me/bookings/[id]
       REFUNDED  → ↩️ đã hoàn tiền
       CANCELLED → ❌ (hết hạn / thất bại)
       PENDING_PAYMENT && vnp_ResponseCode ≠ '00' → ❌ thất bại, còn hạn → [Thanh toán lại]
       PENDING_PAYMENT sau 60s → ⏳ "đang xử lý", [Kiểm tra lại] [Vé của tôi]
```

## 2. Chọn vé (`TicketSelector`)

- Dữ liệu tĩnh (tên, giá) từ `EventDetail` (ISR); số lượng còn từ `useAvailability(eventId)` — `refetchInterval: 5000`, dừng khi tab ẩn (`refetchIntervalInBackground: false`).
- Giới hạn: mỗi hạng `0..min(available, 10)`, tổng ≤ 10.
- Nút **Mua vé** theo `saleState`:

| saleState     | Nút                                                                           |
| ------------- | ----------------------------------------------------------------------------- |
| `NOT_STARTED` | Disabled "Mở bán sau 01:59:12" (đếm ngược → khi về 0 tự refetch availability) |
| `ON_SALE`     | Enabled khi tổng > 0                                                          |
| `SOLD_OUT`    | Disabled "Hết vé"                                                             |
| `ENDED`       | Disabled "Đã đóng bán"                                                        |

- Lựa chọn tạm lưu `sessionStorage['cart:'+eventId]` để sau khi login / qua phòng chờ quay lại vẫn còn.
- Double-click guard: mutation `isPending` → disable nút.

## 3. Đồng hồ giữ chỗ (`Countdown`)

```ts
// lib/server-time.ts
let offset = 0; // serverNow - clientNow
export const serverTime = {
  sync(responseTime: number) {
    offset = responseTime - Date.now();
  },
  now() {
    return Date.now() + offset;
  },
};
// remaining = Date.parse(booking.expiredAt) - serverTime.now()
```

- Tick bằng `requestAnimationFrame`/`setInterval(250ms)`, tính lại từ `serverTime.now()` mỗi lần (không cộng dồn → không trôi khi tab ngủ).
- `< 60s`: màu danger + `aria-live="assertive"` thông báo "Còn 1 phút".
- `≤ 0`: khóa nút thanh toán, refetch booking (kỳ vọng `CANCELLED`), mở dialog.
- Mở lại `/checkout/[id]` của đơn đã `PAID` → redirect vé; `CANCELLED` → thông báo + nút quay lại sự kiện.

## 4. Xử lý lỗi khi tạo booking

> ⚠️ Không có mã lỗi số riêng cho các case này — phân biệt bằng HTTP status + so khớp `message`, xem [05-api-contract §3.3](05-api-contract.md#33-bảng-tra-theo-http-status-bookingpaymentcatalogqueue).

| HTTP status | `message` chứa                 | UI                                                                                                                        |
| ----------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| 409         | "đã hết vé"                    | Toast "Hạng vé X đã hết", refetch availability, reset số lượng hạng đó                                                    |
| 409         | "Chỉ còn N vé"                 | Toast "Chỉ còn N vé" (parse N từ message hoặc từ `data.available` nếu backend trả), set số lượng = N                      |
| 409 / 400   | "chưa mở bán" / "đã đóng bán"  | Refetch event, cập nhật nút theo `saleState`                                                                              |
| 403         | "Token phòng chờ không hợp lệ" | Xóa queue token → `/queue/[id]`                                                                                           |
| 429         | —                              | Disable nút 5s với countdown                                                                                              |
| 401         | —                              | Refresh (tự động, vì request này có `Authorization` header) → nếu fail: login `?next=` (giỏ vẫn còn trong sessionStorage) |
| 5xx / mạng  | —                              | Toast + [Thử lại] (không tự retry POST để tránh giữ chỗ trùng)                                                            |

> Đề xuất backend hỗ trợ header `Idempotency-Key` cho `POST /bookings` — FE sinh `crypto.randomUUID()` mỗi lần bấm, retry cùng key an toàn.

## 5. Đơn hàng & vé (UC-C7)

- `/me/bookings`: tabs theo status (Tất cả / Chờ thanh toán / Đã thanh toán / Đã hủy / Hoàn tiền), phân trang, card có ảnh sự kiện, ngày, tổng tiền, badge. Đơn `PENDING_PAYMENT` còn hạn → nút **Tiếp tục thanh toán** + đồng hồ nhỏ.
- `/me/bookings/[id]`: thông tin đơn + danh sách vé; mỗi vé render `QRCodeSVG value={qrCodeData}` kích thước ≥ 240px, nền trắng (kể cả dark mode), mã rút gọn bên dưới; badge `ISSUED`/`CHECKED_IN`. Nút "Tải vé (PNG)".
- Vé chỉ hiển thị QR khi `ISSUED`; `CHECKED_IN` → QR mờ + "Đã sử dụng lúc …".

## 6. Check-in (UC-O3)

```
/organizer/check-in
  chọn sự kiện (chỉ PUBLISHED, trong ngày diễn ra ưu tiên lên đầu)
  → @zxing/browser decodeFromVideoDevice (camera sau: facingMode 'environment')
  → mỗi mã: bỏ qua nếu trùng mã vừa quét < 3s (debounce)
  → POST /api/bookings/check-in { qrCodeData, eventId }
       200      → màn xanh + beep + navigator.vibrate(100), hiện hạng vé + tên khách, tự đóng 2s
       409/404  → màn đỏ với lý do theo `message` ("đã được check-in trước đó" / "chưa được phát hành" / khác event / không tồn tại)
  → lịch sử phiên (memory), bộ đếm hợp lệ / từ chối
  Fallback: nhập mã thủ công; không có quyền camera → hướng dẫn cấp quyền.
```

Yêu cầu HTTPS (camera) → dev dùng `next dev --experimental-https` khi test trên điện thoại.

## 7. Khách trả bao nhiêu vs Organizer nhận bao nhiêu

`totalAmount` của `Booking`/`Transaction` là số tiền **khách trả (gross)** — không trừ phí nền tảng. Phí nền tảng (`commissionRate` + `flatFeePerTicket` của từng sự kiện) **không xuất hiện ở phía Customer** (không hiển thị trên checkout/vé/hóa đơn) — chỉ được tính khi tổng hợp báo cáo doanh thu và ví của Organizer:

```
Customer trả (checkout)           = totalAmount = Σ (unitPrice × quantity)      ← KHÔNG trừ phí
Organizer thấy (report/ví)        = netRevenue   = totalRevenue - totalPlatformFee
                                     totalPlatformFee = Σ (giá vé × commissionRate + flatFeePerTicket), vé 0đ miễn phí
```

Chi tiết công thức, ví/payout, UI Admin sửa phí và Organizer rút tiền: xem [11-payout-commission](11-payout-commission.md).
