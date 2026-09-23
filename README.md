# 🎫 TicketBooking — Frontend

> **Frontend (Web + Mobile) cho Hệ thống Đặt vé Sự kiện phân tán — TicketBooking**

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
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Cài đặt & Khởi chạy](#-cài-đặt--khởi-chạy)
- [Tài liệu chi tiết](#-tài-liệu-chi-tiết)
- [License](#-license)

---

## 🎯 Tổng quan

**TicketBooking — Frontend** là pnpm workspace monorepo chứa client cho hệ thống đặt vé sự kiện phân tán **TicketBooking**:

- **`apps/web`** — Web client (Next.js App Router + TypeScript), đầy đủ tính năng, đang phát triển chính.
- **`apps/mobile`** — App di động (Expo/React Native), dùng chung contract API và schema validate với web qua `packages/shared`. _(Đang scaffold.)_
- **`packages/shared`** — Type contract API, Zod schema, hàm format dùng chung cho cả 2 app.

---

## ✨ Tính năng theo vai trò

### 👤 Customer (Khách hàng)

| Tính năng                | Mô tả                                                        |
| ------------------------ | ------------------------------------------------------------ |
| 🔍 Tìm kiếm & Lọc        | Tìm sự kiện theo danh mục, địa điểm, thời gian               |
| 🚦 Xếp hàng phòng chờ ảo | Vào hàng chờ real-time (STOMP/WebSocket) khi sự kiện quá tải |
| 🔒 Giữ chỗ (Seat Hold)   | Khóa số lượng vé mong muốn trong **10 phút** để thanh toán   |
| 💳 Thanh toán VNPay      | Thanh toán qua VNPay, poll kết quả tới khi có xác nhận       |
| 🎟 Vé điện tử (QR)        | Xem vé QR, tải về, xem lịch sử đơn hàng                      |

### 🏢 Organizer (Ban tổ chức)

| Tính năng                | Mô tả                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| 📝 Quản lý sự kiện       | Tạo (DRAFT), sửa, cấu hình hạng vé, publish                                                 |
| 📱 Check-in QR Code      | Quét mã QR tại cổng bằng camera, chặn quét trùng                                            |
| 📈 Báo cáo doanh thu     | Thống kê vé bán ra, tỷ lệ lấp đầy, biểu đồ theo ngày, doanh thu ròng sau phí nền tảng       |
| 💰 Ví & rút tiền         | Xem số dư, tiền tự động về sau 7 ngày kể từ khi sự kiện kết thúc, hoặc chủ động xin rút sớm |
| 🔑 Bắt buộc đổi mật khẩu | Tài khoản do Admin cấp kèm mật khẩu tạm, bắt buộc đổi ở lần đăng nhập đầu                   |

### 🛡 Admin (Quản trị viên)

| Tính năng                   | Mô tả                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------- |
| 👥 Cấp tài khoản Organizer  | Tạo trực tiếp tài khoản Organizer sau khi thẩm định giấy phép                         |
| 🔒 Khóa / Mở khóa tài khoản | Quản lý trạng thái tài khoản                                                          |
| 🗂 Quản lý danh mục          | CRUD danh mục sự kiện                                                                 |
| 💸 Phí nền tảng & Payout    | Sửa hoa hồng riêng từng sự kiện; duyệt/từ chối/tạm giữ yêu cầu rút tiền của Organizer |

---

## 🛠 Tech Stack

| Thành phần          | Công nghệ                                  | Chi tiết                                                       |
| ------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| **Framework**       | Next.js (App Router) / TypeScript `strict` | SSR/ISR cho trang công khai, Client Component cho luồng mua vé |
| **Styling**         | Tailwind CSS + shadcn/ui (Radix)           | Design token, dark mode                                        |
| **Server state**    | TanStack Query                             | Cache, polling, retry                                          |
| **Client state**    | Zustand                                    | Auth session, queue token                                      |
| **Form & Validate** | React Hook Form + Zod                      | Schema dùng chung cho validate và kiểu TS                      |
| **Realtime**        | `@stomp/stompjs`                           | Phòng chờ ảo (Virtual Waiting Room)                            |
| **QR**              | `qrcode.react`, `@zxing/browser`           | Hiển thị vé & quét check-in                                    |
| **Test**            | Vitest, Testing Library, MSW, Playwright   | Unit / Integration / E2E                                       |
| **Package manager** | pnpm                                       |                                                                |
| **DevOps**          | Docker (`output: 'standalone'`)            | Tích hợp vào `docker-compose.yml` của backend                  |

---

## 📁 Cấu trúc thư mục

```text
TicketBooking-Frontend/
├── docs/                             # Tài liệu thiết kế (00 → 11, xem mục bên dưới)
├── apps/
│   ├── web/                          # Next.js App Router + TypeScript
│   │   ├── src/
│   │   │   ├── app/                  # Next.js App Router
│   │   │   │   ├── (public)/         #   Trang công khai: /, /events, /categories/[slug]
│   │   │   │   ├── (auth)/           #   /login, /register, /verify-email, /change-password
│   │   │   │   ├── (account)/        #   /me/profile, /me/security — mọi role đã đăng nhập
│   │   │   │   ├── (customer)/       #   /me/bookings, /me/payments — chỉ CUSTOMER
│   │   │   │   ├── (focus)/          #   /queue, /checkout, /payment/result (layout tối giản)
│   │   │   │   ├── organizer/        #   Dashboard, sự kiện, check-in, ví — chỉ ORGANIZER
│   │   │   │   ├── admin/            #   Organizer, danh mục, sự kiện & phí, payout — chỉ ADMIN
│   │   │   │   └── 403/, not-found.tsx, error.tsx, layout.tsx, providers.tsx
│   │   │   ├── features/             # Logic + UI theo domain nghiệp vụ
│   │   │   │   ├── auth/             #   store, hooks, schemas, components/
│   │   │   │   ├── events/           #   catalog: hooks, components/
│   │   │   │   ├── booking/          #   giữ chỗ, giỏ hàng (cart-storage), components/
│   │   │   │   ├── payment/          #   khởi tạo & tra cứu thanh toán VNPay
│   │   │   │   ├── queue/            #   STOMP client, reducer state machine, store
│   │   │   │   ├── tickets/          #   hiển thị vé QR
│   │   │   │   ├── organizer/        #   sự kiện, báo cáo, ví/payout của Organizer
│   │   │   │   └── admin/            #   tài khoản, danh mục, phí & payout (phía Admin)
│   │   │   ├── components/
│   │   │   │   ├── ui/               # Primitive kiểu shadcn (Button, Dialog, DropdownMenu…)
│   │   │   │   └── common/           # PageHeader, Money, DateTime, StatusBadge, RoleGuard…
│   │   │   ├── lib/
│   │   │   │   ├── api.ts            # Tổng hợp các *Api theo domain — nơi DUY NHẤT UI gọi vào
│   │   │   │   ├── http-client.ts    # fetch wrapper: refresh single-flight, ApiError
│   │   │   │   ├── server-fetch.ts   # fetch cho Server Component (không có access token)
│   │   │   │   ├── query-client.ts, query-keys.ts
│   │   │   │   ├── env.ts            # Validate biến môi trường bằng Zod
│   │   │   │   ├── format.ts, server-time.ts
│   │   │   │   └── fake-api.ts       # (gitignored) dữ liệu giả để tự test UI cục bộ
│   │   │   ├── types/api.ts          # Contract dùng chung toàn app
│   │   │   └── proxy.ts              # Chặn route theo cookie ở edge (middleware Next.js)
│   │   ├── public/
│   │   ├── next.config.ts, tsconfig.json, eslint.config.mjs
│   │   └── .env.example
│   └── mobile/                       # Expo/React Native _(đang scaffold)_
├── packages/
│   └── shared/                       # Type contract API, Zod schema, format — dùng chung web + mobile
├── pnpm-workspace.yaml, .npmrc       # node-linker=hoisted (cần cho eslint-config-next lẫn Metro)
├── package.json                      # Script workspace-level (pnpm dev:web, lint, typecheck…)
└── .prettierrc.json, commitlint.config.mjs, .husky/
```

**Quy tắc phụ thuộc:** `app/` → `features/` → `components/`, `lib/`, `types/`. Một feature không import sâu vào feature khác. `apps/mobile` chỉ được import từ `packages/shared`, không bao giờ deep-import từ `apps/web`. Chi tiết đầy đủ: [02 · Architecture](docs/02-architecture.md).

---

## 🚀 Cài đặt & Khởi chạy

### Yêu cầu tiên quyết

- **Node.js 20+** & **pnpm**
- Backend đang chạy (`docker compose up -d` ở repo `TicketBooking`), API Gateway ở `:8080`

### Bước 1: Cài đặt & cấu hình môi trường

Chạy từ **thư mục gốc** — pnpm workspace cài cho mọi package (`apps/web`, `apps/mobile`…) trong một lệnh.

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
```

### Bước 2: Khởi chạy Web

```bash
pnpm dev:web    # Next.js tại http://localhost:3000 (proxy /api → API Gateway)
```

### Bước 3: Kiểm thử

```bash
pnpm test    # Unit / Integration (Vitest)
pnpm e2e     # E2E (Playwright, chạy trên backend thật)
```

### Biến môi trường chính

| Biến                  | Ví dụ                          | Ý nghĩa                                       |
| --------------------- | ------------------------------ | --------------------------------------------- |
| `API_PROXY_TARGET`    | `http://localhost:8080`        | Đích proxy `/api/*` (API Gateway)             |
| `NEXT_PUBLIC_WS_URL`  | `ws://localhost:8080/ws/queue` | WebSocket phòng chờ ảo                        |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000`        | URL của web (dùng cho VNPay `returnUrl`, SEO) |

---

## 📚 Tài liệu chi tiết

| Tài liệu                                                       | Nội dung                                                 |
| :------------------------------------------------------------- | :------------------------------------------------------- |
| [00 · Overview](docs/00-overview.md)                           | Mục tiêu, phạm vi, tech stack, cách chạy                 |
| [01 · Use Cases](docs/01-use-cases.md)                         | Ánh xạ Use Case → màn hình → API                         |
| [02 · Architecture](docs/02-architecture.md)                   | Kiến trúc, rendering, cấu trúc thư mục, state management |
| [03 · Sitemap & Routing](docs/03-sitemap-routing.md)           | Toàn bộ route, phân quyền, wireframe                     |
| [04 · Auth Flow](docs/04-auth-flow.md)                         | Login / Refresh / Logout với HttpOnly cookie             |
| [05 · API Contract](docs/05-api-contract.md)                   | Kiểu TypeScript + endpoint                               |
| [06 · Booking & Payment Flow](docs/06-booking-payment-flow.md) | Giữ chỗ 10 phút, VNPay, poll kết quả                     |
| [07 · Virtual Waiting Room](docs/07-waiting-room.md)           | Client WebSocket STOMP, heartbeat, queue token           |
| [08 · UI & Design System](docs/08-ui-design-system.md)         | Token, component, trạng thái UI, a11y                    |
| [09 · Testing](docs/09-testing.md)                             | Unit / Integration / E2E                                 |
| [10 · Roadmap](docs/10-roadmap.md)                             | Các phase triển khai + tiêu chí nghiệm thu               |
| [11 · Payout & Commission](docs/11-payout-commission.md)       | Phí nền tảng theo sự kiện, ví Organizer, luồng rút tiền  |
| [Conventions](docs/CONVENTIONS.md)                             | Quy ước code, đặt tên, commit                            |

---

## 📄 License

Dự án được phân phối theo giấy phép [MIT License](LICENSE).

---

<p align="center">
  <b>TicketBooking — Frontend</b> · Built with Next.js
</p>
