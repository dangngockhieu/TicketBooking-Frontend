# 00 — Overview

## 1. Mục tiêu

Xây dựng web client cho 3 nhóm người dùng của mô hình **B2B2C** (xem README backend):

| Actor | Mục tiêu trên web |
|---|---|
| **Customer** | Tìm sự kiện → xếp hàng phòng chờ (nếu quá tải) → giữ chỗ 10 phút → thanh toán VNPay → nhận vé QR |
| **Organizer** | Tạo/publish sự kiện, cấu hình hạng vé, check-in QR tại cổng, xem báo cáo doanh thu |
| **Admin** | Duyệt/khóa Organizer, quản lý danh mục, xem tổng quan hệ thống |

## 2. Yêu cầu phi chức năng

| Yêu cầu | Chỉ tiêu |
|---|---|
| SEO trang sự kiện công khai | SSR/ISR, Lighthouse SEO ≥ 90 |
| Hiệu năng | LCP < 2.5s (4G), JS first-load < 200KB cho trang public |
| Chịu burst traffic | Trang sự kiện cache ISR; số vé còn lại tải riêng phía client; phòng chờ không gây request dồn dập (backoff) |
| Bảo mật | Access token chỉ trong memory; refresh token HttpOnly cookie; không lưu PII ở `localStorage`; CSP |
| Responsive | Mobile-first; màn check-in QR dùng tốt trên điện thoại |
| Accessibility | WCAG 2.1 AA cho luồng mua vé |
| Ngôn ngữ | Tiếng Việt mặc định; cấu trúc sẵn cho i18n (en) |
| Tiền tệ / thời gian | VND (`Intl.NumberFormat('vi-VN')`), múi giờ `Asia/Ho_Chi_Minh` |

## 3. Phạm vi

**Trong phạm vi:** toàn bộ UC-C1..C7, UC-O1..O4, UC-A1..A2 (xem [01-use-cases](01-use-cases.md)).

**Ngoài phạm vi (giai đoạn này):** app mobile Flutter, UC-A3 (Grafana — chỉ link ra ngoài), tự dựng thanh toán thật (dùng VNPay sandbox).

## 4. Tech stack

| Hạng mục | Lựa chọn |
|---|---|
| Framework | **Next.js** (App Router, bản stable mới nhất), React, **TypeScript `strict`** |
| Package manager | pnpm |
| Styling | Tailwind CSS + **shadcn/ui** (Radix) + lucide-react |
| Server state | **TanStack Query** |
| Client state | Zustand (auth session, queue token) |
| Form & validation | React Hook Form + **Zod** |
| Realtime | `@stomp/stompjs` (phòng chờ ảo) |
| QR | `qrcode.react` (hiển thị), `@zxing/browser` (quét) |
| Chart | Recharts |
| Date | `date-fns` + `date-fns-tz` |
| Test | Vitest + Testing Library, Playwright |
| Lint/format | ESLint, Prettier, Husky + lint-staged, commitlint |
| Deploy | Docker (`output: 'standalone'`), thêm service `frontend` vào `docker-compose.yml` backend |

## 5. Cách chạy (dự kiến sau Phase P0)

```bash
pnpm install
cp .env.example .env.local

pnpm dev         # Next.js tại http://localhost:3000 (proxy /api → API Gateway)

pnpm test        # Vitest
pnpm e2e         # Playwright
```

> Yêu cầu hạ tầng backend (`docker compose up -d` ở repo `TicketBooking`) và API Gateway đang chạy ở `:8080` trước khi `pnpm dev`.

Biến môi trường chính:

| Biến | Ví dụ | Ý nghĩa |
|---|---|---|
| `API_PROXY_TARGET` | `http://localhost:8080` | Đích proxy `/api/*` (API Gateway) |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8080/ws/queue` | Endpoint WebSocket phòng chờ |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Dùng cho `returnUrl` VNPay, metadata SEO |
