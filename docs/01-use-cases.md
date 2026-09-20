# 01 — Use Cases → Screens → APIs

> Nguồn: `../TicketBooking/README.md` (mục *Tính năng chính*) và `../TicketBooking/docs/system-design.md` (mục 2).

## 1. Customer

| UC | Mô tả | Màn hình (route) | API |
|---|---|---|---|
| **UC-C1** | Đăng ký / Xác thực email (OTP) / Đăng nhập | `/register`, `/verify-email`, `/login` | `POST /api/auth/{register,verify-email,resend-verification,login,refresh,logout,account,change-password}` (xem [04-auth-flow](04-auth-flow.md)) |
| **UC-C2** | Tìm kiếm & lọc sự kiện (danh mục, địa điểm, thời gian, từ khóa) | `/`, `/events`, `/categories/[slug]` | `GET /api/categories`, `GET /api/events?…` |
| **UC-C2b** | Xem chi tiết sự kiện + tình trạng vé real-time | `/events/[eventId]` | `GET /api/events/{id}`, `GET /api/events/{id}/availability` (poll 5s) |
| **UC-C3** | Gợi ý sự kiện thông minh | Block "Dành cho bạn" ở `/`, "Sự kiện tương tự" ở `/events/[id]` | `GET /api/recommendations/events/for-you`, `GET /api/recommendations/events/{id}/similar` |
| **UC-C4** | Xếp hàng phòng chờ ảo | `/queue/[eventId]` | `GET /api/queue/events/{id}/status`, WS `/ws/queue` (STOMP) |
| **UC-C5** | Giữ chỗ 10 phút | Dialog chọn vé ở `/events/[id]` → `/checkout/[bookingId]` | `POST /api/bookings`, `GET /api/bookings/{id}`, `DELETE /api/bookings/{id}` |
| **UC-C6** | Thanh toán VNPay | `/checkout/[bookingId]` → VNPay → `/payment/result` | `POST /api/payments/initiate`, `GET /api/bookings/{id}` (poll) |
| **UC-C7** | Nhận & quản lý vé điện tử | `/me/bookings`, `/me/bookings/[bookingId]` | `GET /api/bookings/me`, `GET /api/bookings/{id}` |
| **UC-C8** | Hồ sơ cá nhân, đổi mật khẩu | `/me/profile`, `/me/security` | `GET/PUT /api/users/me`, `PUT /api/auth/change-password` |
| — | Lịch sử giao dịch | `/me/payments` | `GET /api/payments/history` |

## 2. Organizer

> Organizer **không tự đăng ký**. Đúng theo mô hình B2B2C đóng: Admin thẩm định giấy phép tổ chức sự kiện ngoài hệ thống, sau đó tạo tài khoản trực tiếp.

| UC | Mô tả | Màn hình (route) | API |
|---|---|---|---|
| — | Nhận tài khoản từ Admin, đăng nhập lần đầu bằng mật khẩu tạm, bắt buộc đổi mật khẩu | `/login` → `/change-password` (bắt buộc) → `/organizer` | `POST /api/auth/login`, `PUT /api/auth/change-password` |
| **UC-O1** | Quản lý sự kiện: tạo (DRAFT), sửa, banner, thời gian bán, publish | `/organizer/events`, `/organizer/events/new`, `/organizer/events/[id]/edit` | `GET /api/organizer/events`, `POST /api/events`, `PUT /api/events/{id}`, `PATCH /api/events/{id}/publish`, `POST /api/uploads/banner` |
| **UC-O2** | Quản lý hạng vé (VVIP/VIP/GA, giá, số lượng) | Bước 2 của form sự kiện | (nằm trong payload `POST/PUT /api/events`) |
| **UC-O3** | Check-in QR tại cổng, chặn quét trùng | `/organizer/check-in` (chọn sự kiện → camera) | `POST /api/bookings/check-in` |
| **UC-O4** | Báo cáo doanh thu, tỷ lệ lấp đầy | `/organizer/events/[id]/report`, `/organizer` (dashboard) | `GET /api/organizer/events/{id}/report` |

## 3. Admin

> Admin **tạo** tài khoản Organizer sau khi thẩm định ngoài hệ thống, và có thể khóa/mở khóa tài khoản đã tạo.

| UC | Mô tả | Màn hình (route) | API |
|---|---|---|---|
| **UC-A1** | Tạo tài khoản Organizer / Khóa & mở khóa | `/admin/organizers` | `GET /api/admin/organizers`, `POST /api/admin/organizers`, `PATCH /api/admin/accounts/{id}/status` |
| **UC-A2** | Quản lý danh mục | `/admin/categories` | `POST/PUT/DELETE /api/admin/categories/{id}` |
| **UC-A3** | Giám sát hệ thống | `/admin` (link ra Grafana / Kafka UI) | — |

## 4. System background — ảnh hưởng tới UI

| UC | Mô tả | Hệ quả phía FE |
|---|---|---|
| **UC-S1** | Auto-release sau 10 phút | Đồng hồ đếm ngược ở checkout; hết giờ → khóa nút thanh toán, hiện dialog "Hết thời gian giữ chỗ"; đơn chuyển `CANCELLED` |
| **UC-S2** | Heartbeat 15s | Client ping 10s; mất kết nối → banner cảnh báo + tự reconnect trong cửa sổ 15s |
| **UC-S3** | Email vé QR | Trang kết quả thanh toán ghi "Vé đã được gửi tới email …" + xem vé ngay trên web |
| **UC-S4** | Saga refund | Đơn có thể thành `REFUNDED` sau khi `PAID` → trang kết quả/đơn hàng phải hiển thị trạng thái này |

## 5. State machine dùng chung (từ `database-schema.md`)

```
Booking:  PENDING_PAYMENT ──► PAID ──► REFUNDED
                │
                └──► CANCELLED   (hết hạn / user hủy)

Ticket:   LOCKED ──► ISSUED ──► CHECKED_IN
             └──► CANCELLED

Event:    DRAFT ──► PUBLISHED ──► COMPLETED
                         └──► CANCELLED

Account:  PENDING ──► ACTIVE ◄──► LOCKED
```

Mapping trạng thái → hiển thị (badge):

| Giá trị | Nhãn | Màu |
|---|---|---|
| `PENDING_PAYMENT` | Chờ thanh toán | warning |
| `PAID` | Đã thanh toán | success |
| `CANCELLED` | Đã hủy | muted |
| `REFUNDED` | Đã hoàn tiền | info |
| `ISSUED` | Hợp lệ | success |
| `CHECKED_IN` | Đã check-in | info |
| `DRAFT` / `PUBLISHED` / `COMPLETED` | Nháp / Đang bán / Đã diễn ra | muted / success / muted |
| `PENDING` / `ACTIVE` / `LOCKED` | Chờ duyệt / Hoạt động / Đã khóa | warning / success / danger |
