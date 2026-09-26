# 03 — Sitemap & Routing

## 1. Bảng route

| Route                                | Nhóm               | Quyền                                               | UC         | Render                |
| ------------------------------------ | ------------------ | --------------------------------------------------- | ---------- | --------------------- |
| `/`                                  | public             | Mọi người                                           | C2, C3     | ISR                   |
| `/events`                            | public             | Mọi người                                           | C2         | ISR + searchParams    |
| `/categories/[slug]`                 | public             | Mọi người                                           | C2         | ISR                   |
| `/events/[eventId]`                  | public             | Mọi người (mua vé cần login)                        | C2, C3, C5 | ISR + client island   |
| `/login`                             | auth               | Chưa đăng nhập                                      | C1         | Static                |
| `/register`                          | auth               | Chưa đăng nhập                                      | C1         | Static                |
| `/verify-email`                      | auth               | Mọi người (cần `email` ở query/session)             | C1         | Client                |
| `/change-password`                   | auth-authenticated | Đã đăng nhập (bắt buộc nếu `requirePasswordChange`) | — 🆕       | Client                |
| `/queue/[eventId]`                   | (focus)            | CUSTOMER                                            | C4         | Client                |
| `/checkout/[bookingId]`              | (focus)            | CUSTOMER (chủ đơn)                                  | C5, C6     | Client                |
| `/payment/result`                    | (focus)            | CUSTOMER                                            | C6         | Client                |
| `/me/bookings`                       | (customer)         | CUSTOMER                                            | C7         | Client                |
| `/me/bookings/[bookingId]`           | (customer)         | CUSTOMER (chủ đơn)                                  | C7         | Client                |
| `/me/payments`                       | (customer)         | CUSTOMER                                            | C6         | Client                |
| `/me/profile`, `/me/security`        | (account)          | Mọi role đã đăng nhập                               | C8         | Client                |
| `/organizer`                         | organizer          | ORGANIZER                                           | O4         | Client                |
| `/organizer/events`                  | organizer          | ORGANIZER                                           | O1         | Client + searchParams |
| `/organizer/events/new`              | organizer          | ORGANIZER                                           | O1, O2     | Client                |
| `/organizer/events/[eventId]/edit`   | organizer          | ORGANIZER (chủ sự kiện)                             | O1, O2     | Client                |
| `/organizer/events/[eventId]/report` | organizer          | ORGANIZER (chủ sự kiện)                             | O4         | Client                |
| `/organizer/check-in`                | organizer          | ORGANIZER                                           | O3         | Client                |
| `/organizer/wallet`                  | organizer          | ORGANIZER                                           | O5         | Client + searchParams |
| `/admin`                             | admin              | ADMIN                                               | A3         | Client                |
| `/admin/organizers`                  | admin              | ADMIN                                               | A1         | Client + searchParams |
| `/admin/categories`                  | admin              | ADMIN                                               | A2         | Client                |
| `/admin/events`                      | admin              | ADMIN                                               | A4         | Client + searchParams |
| `/admin/payouts`                     | admin              | ADMIN                                               | A5         | Client + searchParams |
| `/403`, `not-found`, `error`         | —                  | —                                                   | —          | —                     |

`Client + searchParams`: bảng danh sách Client Component nhưng đọc/ghi `page` và filter (status/keyword) qua URL searchParams thay vì state cục bộ — share link được, back/forward giữ đúng trang/bộ lọc. Xem `apps/web/src/lib/use-page-param.ts` và `apps/web/src/components/common/client-pagination.tsx`.

## 2. Guard

```
apps/web/src/proxy.ts  (chạy ở edge, chỉ biết cookie)
  matcher: ['/queue/:path*', '/checkout/:path*', '/payment/:path*', '/me/:path*',
            '/organizer/:path*', '/admin/:path*']
  ├─ không có cookie refreshToken ──► redirect /login?next=<pathname+search>
  └─ có cookie ──► cho qua

⚠️ /change-password KHÔNG nằm trong matcher này — nó được bảo vệ hoàn toàn ở
RoleGuard phía client (chờ bootstrap xong rồi mới biết requirePasswordChange),
không chặn được ở edge vì middleware chỉ thấy cookie, không thấy field đó.

(auth)/layout.tsx
  └─ đã đăng nhập ──► redirect theo role (home của role)

<RoleGuard allow={['ORGANIZER']}>  (trong layout client của từng group)
  ├─ status=loading ──► full-page skeleton
  ├─ role sai ──► /403
  └─ user.requirePasswordChange === true ──► redirect /change-password (mọi route trừ chính nó)

(Customer PENDING chưa xác thực email không đăng nhập được — backend trả 401 (message riêng, không có mã lỗi số) ở /login, xem 04-auth-flow §3.2/§3.3b.
 Organizer không có state PENDING — tài khoản do Admin tạo là ACTIVE ngay, xem 04-auth-flow §3.3c)
```

Home theo role sau đăng nhập: `CUSTOMER → /` · `ORGANIZER → /organizer` · `ADMIN → /admin`. Nếu có `?next=` hợp lệ (bắt đầu bằng `/`, không phải `//`) thì ưu tiên `next`.

## 3. Layout

| Layout                    | Thành phần                                                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `(public)` + `(customer)` | Header: logo, ô tìm kiếm, danh mục, nút Đăng nhập / avatar menu (Vé của tôi, Hồ sơ, Đăng xuất). Footer.                                                            |
| `(auth)`                  | Card căn giữa, logo, link chuyển login ↔ register                                                                                                                  |
| `(account)`               | Dùng chung cho `/me/profile`, `/me/security` — mọi role đã đăng nhập (không riêng Customer); Header + Footer như public, `AccountNav` để chuyển giữa Hồ sơ/Bảo mật |
| `organizer`, `admin`      | Sidebar trái (collapsible trên mobile), topbar có breadcrumb + user menu                                                                                           |
| `(focus)`                 | Dùng chung cho `/queue/[eventId]`, `/checkout/[bookingId]`, `/payment/result` — ẩn điều hướng để giảm rời trang; chỉ logo + đồng hồ                                |

## 4. Wireframe các màn chính

### `/` — Trang chủ

```
┌───────────────────────────────────────────────────────────┐
│     LOGO   [  Tìm sự kiện, nghệ sĩ…    ]   Đăng nhập      │
├───────────────────────────────────────────────────────────┤
│  ███████████ HERO BANNER (sự kiện nổi bật, carousel) ███  │
├───────────────────────────────────────────────────────────┤
│ [Âm nhạc] [Thể thao] [Sân khấu] [Hội thảo] …   (chips)    │
├───────────────────────────────────────────────────────────┤
│ Dành cho bạn  (chỉ khi đã login — UC-C3)          Xem hết │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                           │
│ │ img │ │ img │ │ img │ │ img │   EventCard: ảnh, tên,    │
│ │title│ │title│ │title│ │title│   ngày, địa điểm,         │
│ │từ Xđ│ │từ Xđ│ │từ Xđ│ │từ Xđ│   "Từ 500.000đ"           │
│ └─────┘ └─────┘ └─────┘ └─────┘                           │
│ Sắp diễn ra                                        Xem hết│
│ …                                                         │
└───────────────────────────────────────────────────────────┘
```

### `/events` — Tìm kiếm & lọc

```
┌─────────────────┬──────────────────────────────────────────┐
│ BỘ LỌC          │  45 sự kiện          Sắp xếp: [Ngày ↑ ▾] │
│ Danh mục        │  ┌─────┐ ┌─────┐ ┌─────┐                 │
│ Thành phố [▾]   │  │     │ │     │ │     │                 │
│ Từ ngày  []     │  └─────┘ └─────┘ └─────┘                 │
│ Đến ngày []     │  ┌─────┐ ┌─────┐ ┌─────┐                 │
│ [Xóa lọc]       │  └─────┘ └─────┘ └─────┘                 │
│ (mobile: Sheet) │        ‹ 1 2 3 ›                         │
└─────────────────┴──────────────────────────────────────────┘
URL: /events?category=am-nhac&location=Hà Nội&startFrom=2026-10-01&keyword=…&page=1&sort=startTime,asc
```

### `/events/[eventId]` — Chi tiết & chọn vé

```
┌──────────────────────────────────────────────────────────┐
│ ████████████████ BANNER ████████████████████████████████ │
│ Sơn Tùng MTP Live Concert        [Âm nhạc]               │
│ 📅 19:00 15/06  📍 SVĐ Mỹ Đình, Hà Nội                  │
├───────────────────────────────────┬──────────────────────┤
│ Giới thiệu (mô tả)                │ CHỌN VÉ   (sticky)   │
│ …                                 │ VVIP  3.000.000đ     │
│ Thông tin địa điểm                │   Còn 12   [- 0 +]   │
│ …                                 │ VIP   1.500.000đ     │
│                                   │   Còn 200  [- 2 +]   │
│                                   │ GA      500.000đ     │
│                                   │   HẾT VÉ   (disabled)│
│                                   │ ──────────────────── │
│                                   │ Tổng: 3.000.000đ     │
│                                   │ [   Mua vé   ]       │
│                                   │ Mở bán 09:00 01/05   │
├───────────────────────────────────┴──────────────────────┤
│ Sự kiện tương tự (UC-C3)                                 │
└──────────────────────────────────────────────────────────┘
Trạng thái nút: Chưa mở bán (đếm ngược) · Đang bán · Đã đóng bán · Hết vé
```

### `/verify-email` — Xác thực OTP 🆕

```
┌──────────────────────────────────────────┐
│               Xác thực email             │
│  Mã gồm 6 số đã gửi tới b***@email.com   │
│                                          │
│      [1] [2] [3]   [4] [5] [6]           │
│                                          │
│  Không nhận được mã?                     │
│  [ Gửi lại mã ]  (00:47 mới gửi lại)     │
└──────────────────────────────────────────┘
Auto-submit khi nhập đủ 6 số · lỗi hiện dưới ô nhập, giữ nguyên giá trị
```

### `/queue/[eventId]` — Phòng chờ ảo

```
┌──────────────────────────────────────────────────────────┐
│                 Sơn Tùng MTP Live Concert                │
│                                                          │
│                Bạn đang ở vị trí  #4.523                 │
│           ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░  (progress)           │
│         Thời gian chờ ước tính: ~ 9 phút                 │
│         Tổng số người đang chờ: 15.402                   │
│                                                          │
│    Không đóng tab hoặc tải lại trang — bạn sẽ mất chỗ.   │
│   ● Đã kết nối            (● Mất kết nối, đang thử lại…) │
│                                                          │
│                   [ Rời hàng chờ ]                       │
└──────────────────────────────────────────────────────────┘
```

### `/checkout/[bookingId]` — Thanh toán

```
┌──────────────────────────────────────────────────────────┐
│ LOGO                         Giữ chỗ còn  09:42          │
├───────────────────────────────────┬──────────────────────┤
│ Thông tin đơn hàng                │ Phương thức          │
│ Sơn Tùng MTP · 15/06 19:00        │ (●) MoMo            │
│ VIP × 2      1.500.000  3.000.000 │     ATM / QR Pay     │
│ ───────────────────────────────── │                      │
│ Tổng cộng              3.000.000đ │ [ Thanh toán ]       │
│                                   │ [ Hủy đơn ]          │
└───────────────────────────────────┴──────────────────────┘
< 60s: đồng hồ đỏ + nhấp nháy · hết giờ: dialog "Hết thời gian giữ chỗ" → [Quay lại sự kiện]
```

### `/payment/result`

```
Đang xác nhận (poll)  →  ✅ Thanh toán thành công! Vé đã gửi tới a@b.com  [Xem vé]
                      →  ❌ Thanh toán thất bại (mã MoMo …)  [Thử lại] (nếu còn hạn giữ chỗ)
                      →  ⏳ Chưa nhận được xác nhận sau 60s  [Kiểm tra lại] [Vé của tôi]
                      →  ↩️ Đơn đã hoàn tiền (Saga)  — liên hệ hỗ trợ
```

### `/me/bookings/[bookingId]` — Vé điện tử

```
┌─────────────────────────────┐
│ Sơn Tùng MTP · VIP          │
│ ┌─────────────────────────┐ │
│ │        ▄▄▄ QR ▄▄▄       │ │   Vuốt/tabs giữa các vé trong đơn
│ │        █▀▀▀▀▀▀█         │ │   Trạng thái: Hợp lệ / Đã check-in
│ └─────────────────────────┘ │   Tăng độ sáng màn hình gợi ý
│ Vé 1/2 · Mã: 7F3A…          │
└─────────────────────────────┘
```

### `/organizer/events/new` — Form nhiều bước

```
 ① Thông tin cơ bản  ─  ② Hạng vé  ─  ③ Thời gian bán  ─  ④ Xem lại
 ① Tên*, Danh mục*, Mô tả, Địa điểm*, Tên venue, Banner (upload, preview 16:9), Bắt đầu*, Kết thúc*
 ② Bảng động: [Tên*] [Mô tả] [Giá*] [Số lượng*] [↑↓] [🗑]   [+ Thêm hạng vé]
 ③ Mở bán*, Đóng bán* (validate: saleStart < saleEnd ≤ start < end)
 ④ Preview như trang công khai → [Lưu nháp] [Lưu & Publish]
```

### `/organizer/check-in`

```
┌──────────────────────────────┐
│ Sự kiện: [Sơn Tùng MTP ▾]    │
│ ┌──────────────────────────┐ │
│ │       CAMERA VIEW        │ │
│ │       ┌────────┐         │ │
│ │       │ khung  │         │ │
│ │       └────────┘         │ │
│ └──────────────────────────┘ │
│ ✅ HỢP LỆ — VIP · Nguyễn Văn A│  (xanh, rung, beep)
│ ⛔ ĐÃ CHECK-IN lúc 18:30      │  (đỏ)
│ [Nhập mã thủ công]            │
│ Lịch sử phiên: 124 vé         │
└───────────────────────────────┘
```

### `/admin/organizers`

```
                                                    [ + Tạo tài khoản Organizer ]
Tabs: [Hoạt động] [Đã khóa]
┌───────────────┬───────────────┬────────────┬──────────────────────┐
│ Email         │ Ngày tạo      │ Trạng thái │ Thao tác             │
├───────────────┼───────────────┼────────────┼──────────────────────┤
│ bto@abc.vn    │ 20/09/2026    │ Hoạt động  │ [Khóa]               │
└───────────────┴───────────────┴────────────┴──────────────────────┘

Dialog "Tạo tài khoản Organizer":
  Email*, Họ tên/Tên đơn vị*
  → [Tạo] → hiển thị "Đã tạo. Mật khẩu tạm: ••••••••" (chỉ 1 lần, có nút Copy)
             (Admin tự sao chép và chuyển cho Organizer — hệ thống không tự gửi email)
Khóa → Dialog nhập "Lý do" (bắt buộc)
```

### `/change-password` — 🆕 Đổi mật khẩu (bắt buộc cho Organizer lần đầu)

```
┌───────────────────────────────────────────┐
│              Đổi mật khẩu                 │
│  Bạn cần đặt mật khẩu mới trước khi tiếp  │
│  tục sử dụng hệ thống.                    │
│                                           │
│  Mật khẩu hiện tại      [••••••••]        │
│  Mật khẩu mới           [••••••••]        │
│  Xác nhận mật khẩu mới  [••••••••]        │
│                                           │
│              [ Đổi mật khẩu ]             │
└───────────────────────────────────────────┘
Chế độ bắt buộc: không có nút Hủy/Quay lại, không thể đóng bằng phím Esc
```

### `/organizer/wallet` — Ví Organizer 🆕

```
┌──────────────────────────────────────────────┐
│ Ví của tôi              [ Yêu cầu rút tiền ] │
│ Tiền tự động về trong 7 ngày sau khi sự kiện  │
│ kết thúc. Cần gấp hơn? Gửi yêu cầu bên dưới.  │
├──────────────┬──────────────┬────────────────┤
│ Số dư khả dụng│ Đang chờ xử lý│ Đã rút từ trước│
│ 12.500.000đ  │ 8.000.000đ   │ 20.000.000đ    │
├──────────────┴──────────────┴────────────────┤
│ Lịch sử yêu cầu rút tiền                      │
│ Ngày · Nguồn · Số tiền · Ngân hàng · Trạng thái│
└──────────────────────────────────────────────┘
Dialog "Yêu cầu rút tiền": Số tiền (≤ số dư khả dụng), Ngân hàng, Số tài khoản, Tên chủ tài khoản
Nút disable nếu số dư khả dụng = 0
```

### `/admin/events` — Sự kiện & phí nền tảng 🆕

```
┌──────────────────────────────────────────────┐
│ Sự kiện & phí nền tảng                        │
│ Tabs: [Tất cả] [Nháp] [Đang bán] [Đã hủy] [Đã diễn ra] │
│ [ Tìm theo tên sự kiện… ]                     │
├──────────┬──────────┬────────┬────────┬──────┤
│ Sự kiện  │Ngày diễn ra│Trạng thái│Phí nền tảng│  │
├──────────┼──────────┼────────┼────────┼──────┤
│ Concert X│ 15/06/26 │ Đang bán│5.0%+3.000đ/vé│[Sửa phí]│
└──────────┴──────────┴────────┴────────┴──────┘
Dialog "Sửa phí": Tỷ lệ hoa hồng (%), Phí cố định mỗi vé (VNĐ)
Mặc định 5% + 3.000đ; vé giá 0đ luôn miễn phí tự động — xem 11-payout-commission.md
```

### `/admin/payouts` — Yêu cầu rút tiền 🆕

```
Tabs: [Tất cả] [Chờ duyệt] [Đã duyệt] [Tạm giữ] [Đã chi trả] [Đã từ chối]
┌────────┬───────────┬──────┬────────┬────────────┬──────────┬────────┐
│Ngày y/c│ Organizer │Nguồn │Số tiền │Tài khoản nhận│Trạng thái│Thao tác│
├────────┼───────────┼──────┼────────┼────────────┼──────────┼────────┤
│20/09/26│organizer@…│Tự động│5.000.000đ│VCB · 007…│Chờ duyệt │[Duyệt][Từ chối]│
└────────┴───────────┴──────┴────────┴────────────┴──────────┴────────┘
PENDING  → [Duyệt] [Từ chối *lý do bắt buộc*]
APPROVED → [Đã chuyển khoản] [Tạm giữ *lý do bắt buộc*]
HOLD     → [Mở lại]
PAID / REJECTED → không còn thao tác (trạng thái cuối)
```
