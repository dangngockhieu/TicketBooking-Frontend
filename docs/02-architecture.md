# 02 — Architecture

## 1. Tổng quan

```
                ┌──────────────────────────── Browser ────────────────────────────┐
                │  React (Client Components) · TanStack Query · Zustand · STOMP    │
                └───────────────┬───────────────────────────────┬─────────────────┘
                                │ /api/*  (same-origin, cookie) │ ws://…/ws/queue
                ┌───────────────▼────────────────┐              │
                │        Next.js server           │              │
                │  • Server Components (SSR/ISR) │              │
                │  • middleware.ts (route guard) │              │
                │  • rewrites /api/* ──────────┐ │              │
                └──────────────────────────────┼─┘              │
                                               ▼                ▼
                        ┌─────────────────────────────────────────────┐
                        │        API Gateway (Spring Cloud Gateway)    │
                        │            localhost:8080 / :443             │
                        └─────────────────────────────────────────────┘
```

## 2. Quyết định kiến trúc (ADR tóm tắt)

### ADR-01: Proxy `/api/*` qua Next rewrites

- `next.config.ts` → `rewrites: [{ source: '/api/:path*', destination: `${API_PROXY_TARGET}/api/:path*` }]`, `API_PROXY_TARGET` trỏ tới API Gateway (`http://localhost:8080` local, domain thật khi deploy).
- **Lý do:** cookie `refreshToken` (HttpOnly, SameSite=Strict, path=/) được set trên domain FE → `middleware.ts` đọc được; không cần CORS.
- WebSocket không đi qua rewrites → kết nối thẳng `NEXT_PUBLIC_WS_URL`, xác thực bằng access token trong header STOMP `CONNECT`.

### ADR-02: Access token chỉ ở memory

- Lưu trong Zustand store (không persist). F5 → gọi `POST /api/auth/refresh` để lấy lại. Chi tiết: [04-auth-flow](04-auth-flow.md).

### ADR-03: Chiến lược render theo route

| Nhóm route                                                                       | Render                                                      | Data fetching                                      |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| `/`, `/events`, `/categories/[slug]`                                             | Server Component, ISR `revalidate: 60`                      | `fetch` server-side tới `API_PROXY_TARGET`         |
| `/events/[eventId]`                                                              | Server Component, ISR `revalidate: 60` + `generateMetadata` | Phần **số vé còn lại** là Client Component poll 5s |
| `/login`, `/register`                                                            | Static + Client form                                        | —                                                  |
| `/queue`, `/checkout`, `/payment/result`, `/me/**`, `/organizer/**`, `/admin/**` | Client Component (dynamic)                                  | TanStack Query qua `httpClient` (có Bearer)        |

> Server Component **không gọi API cần đăng nhập** (không có access token ở server). Mọi dữ liệu cá nhân lấy ở client.

### ADR-04: Server state vs client state

- **Server state** (event, booking, report…): chỉ TanStack Query. Không copy vào Zustand.
- **Client state** tối thiểu: `authStore` (accessToken, user, status), `queueStore` (queue token theo eventId, cũng lưu `sessionStorage`).
- **URL state:** bộ lọc/phân trang ở `/events` đồng bộ `searchParams` (share link được, back/forward đúng).

### ADR-05: Contract-first

- Type API viết tay trong `packages/shared/src/types.ts` (import trong app code qua `@ticketbooking/shared`) theo [05-api-contract](05-api-contract.md) cho đến khi backend có OpenAPI (springdoc) → khi đó sinh bằng `openapi-typescript` và thay thế. Đã tách sang `packages/shared` để dùng chung với `apps/mobile` — xem `.claude/CLAUDE.md`.

## 3. Cấu trúc thư mục

> Cây dưới đây là bên trong `apps/web/` (monorepo pnpm workspace — xem README §Cấu trúc thư mục cho layout đầy đủ, gồm `apps/mobile` và `packages/shared`).

```
apps/web/
├── public/
├── src/
│   ├── app/
│   │   ├── (public)/               # layout có header/footer
│   │   ├── (auth)/                 # layout tối giản: /login, /register, /verify-email, /change-password
│   │   ├── (customer)/             # guard: CUSTOMER — /me/bookings, /me/payments
│   │   ├── (account)/              # guard: mọi role đã đăng nhập — /me/profile, /me/security
│   │   ├── (focus)/                # guard: CUSTOMER — /queue, /checkout, /payment/result (layout tối giản)
│   │   ├── organizer/              # guard: ORGANIZER + ép /change-password nếu requirePasswordChange
│   │   ├── admin/                  # guard: ADMIN
│   │   ├── layout.tsx  providers.tsx  not-found.tsx  error.tsx
│   ├── features/
│   │   ├── auth/        { hooks.ts, schemas.ts, store.ts, components/ }
│   │   ├── events/
│   │   ├── booking/
│   │   ├── payment/
│   │   ├── queue/       { stomp-client.ts, useQueue.ts, components/, store.ts }
│   │   ├── tickets/
│   │   ├── organizer/   { hooks.ts (events, report, wallet, payouts), components/ }
│   │   ├── admin/       { hooks.ts (organizers, categories, commission, payouts), components/ }
│   │   └── recommend/
│   ├── components/
│   │   ├── ui/                     # shadcn (Button, Dialog, …)
│   │   └── common/                 # PageHeader, DataTable, StatusBadge, PayoutStatusBadge, Money, Countdown, EmptyState…
│   ├── lib/
│   │   ├── http-client.ts          # fetch wrapper: ApiResponse, ApiError, refresh single-flight
│   │   ├── api.ts                  # tổng hợp các *Api theo domain (authApi, catalogApi, bookingApi, paymentApi, payoutApi, adminApi, …)
│   │   ├── query-client.ts         # QueryClient + default options
│   │   ├── query-keys.ts
│   │   ├── env.ts                  # validate env bằng Zod
│   │   └── server-time.ts          # bù lệch đồng hồ theo responseTime
│   ├── types/query.ts              # filter/query param riêng của web (PageQuery, BookingFilter…)
│   └── proxy.ts                    # middleware Next.js (chặn theo cookie ở edge)
├── e2e/                            # Playwright
├── .env.example
├── next.config.ts
└── package.json

packages/shared/src/
├── types.ts                        # contract theo API Gateway (bao gồm Payout/Commission, xem 11-payout-commission.md)
├── format.ts                       # tiền VND, ngày giờ VN
├── error-messages.ts               # phân loại lỗi theo (httpStatus, message)
└── index.ts                        # re-export toàn bộ, import bằng "@ticketbooking/shared"
```

**Quy tắc phụ thuộc:** `app/` → `features/` → `components/`, `lib/`, `types/`. Feature **không** import chéo nội bộ feature khác (chỉ qua `index.ts` public).

> ⚠️ **Monorepo**: cây thư mục trên nằm dưới `apps/web/`, không phải ở gốc repo — xem README §Cấu trúc thư mục cho layout đầy đủ (bao gồm `apps/mobile`, `packages/shared`).
>
> `apps/web/src/lib/api.ts` luôn gọi backend thật qua `http-client.ts`, và `apps/web/src/proxy.ts` + `RoleGuard` luôn kiểm tra cookie/role thật — đây là trạng thái phải giữ ở mọi commit. Để tự test UI khi chưa có backend, viết `apps/web/src/lib/fake-api.ts` (gitignored) và tạm re-export từ đó — luôn revert về bản gọi thật trước khi commit, xem `.claude/CLAUDE.md` §Running the UI without the backend.

## 4. HTTP client

```ts
// src/lib/http-client.ts (phác thảo)
// Lưu ý: ApiResponse.status là HTTP status code thô (200/400/401/403/404/409/429/500…),
// KHÔNG phải mã lỗi tùy chỉnh — xem 05-api-contract §3.
export class ApiError extends Error {
  constructor(
    public httpStatus: number, // = ApiResponse.status
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

export async function http<T>(path: string, init?: RequestInit & { auth?: boolean }): Promise<T> {
  const res = await doFetch(path, init); // gắn Authorization, X-Client-Type: WEB, credentials: 'include'
  if (res.status === 401 && init?.auth !== false) {
    await refreshOnce(); // single-flight: các request đồng thời chờ chung 1 promise
    return http<T>(path, { ...init, auth: false }); // retry 1 lần
  }
  const body = (await res.json()) as ApiResponse<T>;
  serverTime.sync(body.responseTime);
  if (res.status >= 400) throw new ApiError(res.status, body.message, body.errors);
  return body.data as T;
}
```

- Mặc định TanStack Query: `retry` chỉ cho lỗi mạng/5xx (không retry 4xx), `staleTime: 30s`, `refetchOnWindowFocus` bật cho `/me/**`.
- Phân loại lỗi dựa trên `(httpStatus, message)` vì không có mã lỗi số riêng — tập trung logic so khớp `message` ở `packages/shared/src/error-messages.ts` (import qua `@ticketbooking/shared`; xem [05-api-contract §3](05-api-contract.md#3-xử-lý-lỗi)).

## 5. Query keys

```ts
export const qk = {
  categories: ["categories"] as const,
  events: (f: EventFilter) => ["events", f] as const,
  event: (id: string) => ["event", id] as const,
  availability: (id: string) => ["event", id, "availability"] as const,
  booking: (id: string) => ["booking", id] as const,
  myBookings: (f: BookingFilter) => ["bookings", "me", f] as const,
  queueStatus: (eventId: string) => ["queue", eventId] as const,
  organizerEvents: (f: PageQuery) => ["organizer", "events", f] as const,
  report: (eventId: string) => ["organizer", "report", eventId] as const,
  adminOrganizers: (f: AccountFilter) => ["admin", "organizers", f] as const,
  me: ["me"] as const,
};
```

## 6. Bảo mật

- `X-Client-Type: WEB` trên mọi request auth → backend set cookie thay vì trả refresh token trong body.
- CSP (`next.config.ts` headers): `default-src 'self'`; `connect-src` thêm `NEXT_PUBLIC_WS_URL`; `img-src` thêm domain storage banner; `form-action` thêm domain VNPay.
- Không `dangerouslySetInnerHTML` cho mô tả sự kiện; nếu cần rich text → render Markdown đã sanitize.
- Organizer/Admin guard ở **cả** middleware (có cookie?) **và** layout (role đúng?). Backend vẫn là nơi kiểm tra quyền cuối cùng.
