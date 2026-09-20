# 🎫 TicketBooking — Frontend

> **Web Client cho Hệ thống Đặt vé Sự kiện phân tán — TicketBooking**

[![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-shadcn%2Fui-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![TanStack Query](https://img.shields.io/badge/TanStack-Query-ff4154?logo=reactquery)](https://tanstack.com/query)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2ead33?logo=playwright)](https://playwright.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-package%20manager-f69220?logo=pnpm)](https://pnpm.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 📖 Mục lục

- [Tổng quan](#-tổng-quan)
- [Trạng thái dự án](#-trạng-thái-dự-án)
- [Tính năng theo vai trò](#-tính-năng-theo-vai-trò)
- [Tech Stack](#-tech-stack)
- [Cài đặt & Khởi chạy](#-cài-đặt--khởi-chạy)
- [Tài liệu chi tiết](#-tài-liệu-chi-tiết)
- [License](#-license)

---

## 🎯 Tổng quan

**TicketBooking — Frontend** là web client (Next.js App Router + TypeScript) cho hệ thống đặt vé sự kiện phân tán **TicketBooking**. Repo backend tương ứng: [`../TicketBooking`](../TicketBooking).

---

## 🚧 Trạng thái dự án

| Hạng mục | Trạng thái |
|---|---|
| Tài liệu thiết kế FE (`docs/`) | ✅ Đã viết |
| Mã nguồn FE | 🚧 Nền tảng + luồng Customer (Auth, Catalog, Booking & Payment) đã dựng; Organizer/Admin chưa làm |
| Backend | 🟡 Mới có `auth-service`, `config-server`, `discovery` — các endpoint còn lại của FE chưa gọi được |

---

## ✨ Tính năng theo vai trò

### 👤 Customer (Khách hàng)
| Tính năng | Mô tả |
|---|---|
| 🔍 Tìm kiếm & Lọc | Tìm sự kiện theo danh mục, địa điểm, thời gian |
| 🚦 Xếp hàng phòng chờ ảo | Vào hàng chờ real-time (STOMP/WebSocket) khi sự kiện quá tải |
| 🔒 Giữ chỗ (Seat Hold) | Khóa số lượng vé mong muốn trong **10 phút** để thanh toán |
| 💳 Thanh toán VNPay | Thanh toán qua VNPay, poll kết quả tới khi có xác nhận |
| 🎟 Vé điện tử (QR) | Xem vé QR, tải về, xem lịch sử đơn hàng |

### 🏢 Organizer (Ban tổ chức)
| Tính năng | Mô tả |
|---|---|
| 📝 Quản lý sự kiện | Tạo (DRAFT), sửa, cấu hình hạng vé, publish |
| 📱 Check-in QR Code | Quét mã QR tại cổng bằng camera, chặn quét trùng |
| 📈 Báo cáo doanh thu | Thống kê vé bán ra, tỷ lệ lấp đầy, biểu đồ theo ngày |
| 🔑 Bắt buộc đổi mật khẩu | Tài khoản do Admin cấp kèm mật khẩu tạm, bắt buộc đổi ở lần đăng nhập đầu |

### 🛡 Admin (Quản trị viên)
| Tính năng | Mô tả |
|---|---|
| 👥 Cấp tài khoản Organizer | Tạo trực tiếp tài khoản Organizer sau khi thẩm định giấy phép |
| 🔒 Khóa / Mở khóa tài khoản | Quản lý trạng thái tài khoản |
| 🗂 Quản lý danh mục | CRUD danh mục sự kiện |

---

## 🛠 Tech Stack

| Thành phần | Công nghệ | Chi tiết |
|---|---|---|
| **Framework** | Next.js (App Router) / TypeScript `strict` | SSR/ISR cho trang công khai, Client Component cho luồng mua vé |
| **Styling** | Tailwind CSS + shadcn/ui (Radix) | Design token, dark mode |
| **Server state** | TanStack Query | Cache, polling, retry |
| **Client state** | Zustand | Auth session, queue token |
| **Form & Validate** | React Hook Form + Zod | Schema dùng chung cho validate và kiểu TS |
| **Realtime** | `@stomp/stompjs` | Phòng chờ ảo (Virtual Waiting Room) |
| **QR** | `qrcode.react`, `@zxing/browser` | Hiển thị vé & quét check-in |
| **Test** | Vitest, Testing Library, MSW, Playwright | Unit / Integration / E2E |
| **Package manager** | pnpm | |
| **DevOps** | Docker (`output: 'standalone'`) | Tích hợp vào `docker-compose.yml` của backend |

---

## 🚀 Cài đặt & Khởi chạy

### Yêu cầu tiên quyết
- **Node.js 20+** & **pnpm**
- Backend đang chạy (`docker compose up -d` ở repo `TicketBooking`), API Gateway ở `:8080`

### Bước 1: Cài đặt & cấu hình môi trường
```bash
pnpm install
cp .env.example .env.local
```

### Bước 2: Khởi chạy Web
```bash
pnpm dev     # Next.js tại http://localhost:3000 (proxy /api → API Gateway)
```

### Bước 3: Kiểm thử
```bash
pnpm test    # Unit / Integration (Vitest)
pnpm e2e     # E2E (Playwright, chạy trên backend thật)
```

### Biến môi trường chính

| Biến | Ví dụ | Ý nghĩa |
|---|---|---|
| `API_PROXY_TARGET` | `http://localhost:8080` | Đích proxy `/api/*` (API Gateway) |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8080/ws/queue` | WebSocket phòng chờ ảo |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | URL của web (dùng cho VNPay `returnUrl`, SEO) |

---

## 📚 Tài liệu chi tiết

| Tài liệu | Nội dung |
|:---|:---|
| [00 · Overview](docs/00-overview.md) | Mục tiêu, phạm vi, tech stack, cách chạy |
| [01 · Use Cases](docs/01-use-cases.md) | Ánh xạ Use Case → màn hình → API |
| [02 · Architecture](docs/02-architecture.md) | Kiến trúc, rendering, cấu trúc thư mục, state management |
| [03 · Sitemap & Routing](docs/03-sitemap-routing.md) | Toàn bộ route, phân quyền, wireframe |
| [04 · Auth Flow](docs/04-auth-flow.md) | Login / Refresh / Logout với HttpOnly cookie |
| [05 · API Contract](docs/05-api-contract.md) | Kiểu TypeScript + endpoint |
| [06 · Booking & Payment Flow](docs/06-booking-payment-flow.md) | Giữ chỗ 10 phút, VNPay, poll kết quả |
| [07 · Virtual Waiting Room](docs/07-waiting-room.md) | Client WebSocket STOMP, heartbeat, queue token |
| [08 · UI & Design System](docs/08-ui-design-system.md) | Token, component, trạng thái UI, a11y |
| [09 · Testing](docs/09-testing.md) | Unit / Integration / E2E |
| [10 · Roadmap](docs/10-roadmap.md) | Các phase triển khai + tiêu chí nghiệm thu |
| [Conventions](docs/CONVENTIONS.md) | Quy ước code, đặt tên, commit |

---

## 📄 License

Dự án được phân phối theo giấy phép [MIT License](LICENSE).

---

<p align="center">
  <b>TicketBooking — Frontend</b> · Built with Next.js
</p>
