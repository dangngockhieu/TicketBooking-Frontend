# 04 — Auth Flow

> Bám theo code thật của `auth-service` (`AuthController`, `ClientType`, `AuthResponse`).

## 1. Hành vi backend (đã kiểm tra trong code)

| Endpoint | Request | Response `data` | Backend | Ghi chú |
|---|---|---|---|---|
| `POST /api/auth/register` | `{ email, password (≥6) }` | `UserInfo { id, email, role: 'CUSTOMER', status: 'PENDING' }` — HTTP 201 | ✅ | **Chỉ tạo tài khoản CUSTOMER** — không có trường `role` trong request (xem §3.3). Tài khoản mới luôn `status = PENDING`, **chưa đăng nhập được** cho tới khi xác thực OTP |
| `POST /api/auth/verify-email` | `{ email, otp }` — `otp` **phải** khớp regex 6 chữ số | `AuthResponse` (tự động đăng nhập, `requirePasswordChange: false`) | ✅ | `PENDING → ACTIVE`. Chỉ dùng cho Customer |
| `POST /api/auth/resend-verification` | `{ email }` | `null` | ✅ | Cooldown 60s (vượt → HTTP 429) |
| `POST /api/auth/login` | Header `X-Client-Type: WEB` + `{ email, password }` | `{ accessToken, tokenType: "Bearer", expiresIn, user, requirePasswordChange }` | ✅ | WEB → refresh token **chỉ** nằm trong `Set-Cookie: refreshToken=…; HttpOnly; SameSite=Strict; Path=/`. `requirePasswordChange` **luôn có mặt** trong response (không phải optional) — `true` khi Organizer đăng nhập lần đầu bằng mật khẩu tạm, xem §3.3c |
| `POST /api/auth/refresh` | Cookie `refreshToken` (tự gửi) | như login | ✅ | Rotate: set cookie mới |
| `POST /api/auth/logout` | Bearer | `null` | ✅ | Xóa cookie (`Max-Age=0`) |
| `GET /api/auth/account` | Bearer | `UserInfo` | ✅ | |
| `PUT /api/auth/change-password` | Bearer + `{ currentPassword, newPassword, confirmPassword }` | `null` + xóa cookie `refreshToken` | ✅ | Xem §3.3c. Xác thực `currentPassword`, kiểm tra `newPassword === confirmPassword`, `newPassword` phải khác `currentPassword`, sau đó thu hồi **toàn bộ** refresh token của tài khoản (kể cả phiên hiện tại) — client phải đăng nhập lại bằng mật khẩu mới |
| `POST /api/admin/organizers` | `{ email, fullName }` | `{ account: UserInfo, tempPassword }` — HTTP 201 | ✅ | Xem §3.3c. Bảo vệ bằng `hasRole('ADMIN')` |

JWT access token claims: `sub = email`, `userId`, `role`, `permissions: ["ROLE_…"]`, `exp`.

> ⚠️ **Không có mã lỗi số riêng (1003/2001/2002/2003…).** Mọi lỗi chỉ có HTTP status thô + `message` chuỗi tiếng Việt — xem [05-api-contract §3](05-api-contract.md#3-xử-lý-lỗi) để biết chi tiết & lý do. Các lỗi liên quan tới auth:
> - **400** — validation field sai (email sai định dạng, password ngắn hơn 6, OTP không đúng 6 chữ số, `newPassword` ≠ `confirmPassword`, `newPassword` trùng `currentPassword`) → có `errors{field}` hoặc lỗi chung.
> - **401** — dùng chung cho: sai mật khẩu lúc login/đổi mật khẩu, VÀ tài khoản bị khóa/chưa xác thực email lúc login (phân biệt bằng `message`, xem §3.3b), VÀ access token hết hạn (tự refresh, xem §3.4).
> - **409** — email đã tồn tại (register / tạo Organizer), hoặc tài khoản đã `ACTIVE` mà gọi lại verify-email/resend-verification.
> - **429** — gọi `resend-verification` quá nhanh (< 60s từ lần trước).
>
> **Organizer không tự đăng ký.** Admin tạo tài khoản Organizer trực tiếp (`status = ACTIVE` ngay, không qua `PENDING`/OTP) sau khi thẩm định giấy phép ngoài hệ thống — xem §3.3c.

## 2. Auth store

```ts
type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'anonymous';

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  expiresAt: number | null;      // epoch ms (serverTime.now() + expiresIn*1000)
  user: UserInfo | null;
  setSession(res: AuthResponse): void;
  clear(): void;
}
```
Không persist. Chỉ `http-client` và `features/auth` được đọc `accessToken`.

## 3. Luồng

### 3.1 Khởi động app (bootstrap)
```
AuthProvider mount
  status = 'loading'
  POST /api/auth/refresh  (credentials: include)
    ├─ 200 → setSession(data) → status='authenticated'
    └─ 401 → clear() → status='anonymous'
```
Các trang public vẫn render ngay (không chặn bởi bootstrap); chỉ `RoleGuard` chờ `status !== 'loading'`.

### 3.2 Đăng nhập
```
LoginForm (RHF + Zod: email hợp lệ, password bắt buộc)
  → POST /api/auth/login  (X-Client-Type: WEB)
     ├─ 200, requirePasswordChange=true  → setSession → redirect /change-password (bắt buộc, xem §3.3c)
     ├─ 200, requirePasswordChange=false → setSession → queryClient.clear() → redirect(next ?? homeOf(role))
     ├─ 400 (có errors) → gán errors vào từng field (setError)
     └─ 401 (không có errors) → phân loại theo message, xem §3.3b:
          ├─ "Email hoặc mật khẩu không chính xác." → lỗi chung dưới form
          ├─ chứa "xác thực" → Alert kèm nút "Xác thực ngay"
          └─ chứa "đã bị khóa" → Alert: tài khoản bị khóa
```
> Request `/login` **không có** header `Authorization` (chưa đăng nhập) → `http-client` biết đây **không phải** case access-token-hết-hạn nên **không** tự động refresh khi nhận 401, hiển thị lỗi ngay dưới form (xem §3.4).

### 3.3 Đăng ký (chỉ Customer)

> `/register` **chỉ dành cho Customer**. Không có `role` trong form/request. Organizer **không đăng ký qua đây** — xem §3.3c. Backend thật: `docs/technical-flows.md §0` (repo TicketBooking).

```
POST /register  { email, password }        (không có role — luôn tạo CUSTOMER)
  → 201 → sessionStorage['pending-email'] = email → redirect /verify-email?email=…
     → sau xác thực OTP thành công → tự động đăng nhập → `/`
```

- Validate client: email, password ≥ 6 (khớp backend; nếu backend nâng lên 8 thì đổi schema), xác nhận mật khẩu trùng khớp.
- `/verify-email?email=…`: ô nhập OTP 6 số (auto-focus, auto-submit khi đủ 6 ký tự), nút "Gửi lại mã" disable 60s sau mỗi lần gửi (đồng bộ với cooldown Redis phía server).
- Vào thẳng `/verify-email` mà không có `email` hợp lệ trong session/query → yêu cầu nhập lại email → gọi `resend-verification`.
- UI đăng ký **không hiển thị lựa chọn "Tôi là Ban tổ chức"** (xem [03-sitemap-routing](03-sitemap-routing.md)). Người muốn trở thành Organizer được hướng dẫn tới trang liên hệ tĩnh (`/lien-he-to-chuc` hoặc tương đương) — không phải một form gửi vào hệ thống.

### 3.3b Phân biệt các lỗi 401 khi login

> **Không có mã lỗi riêng** — sai mật khẩu, tài khoản khóa, và tài khoản chưa xác thực email đều ném ra exception khác nhau (`InvalidCredentialsException` / `UnauthorizedException`) nhưng `GlobalExceptionHandler` map **cả hai loại về cùng HTTP 401**, chỉ khác `message`. FE bắt buộc phải so khớp chuỗi `message` (tập trung ở `lib/error-messages.ts`, viết test snapshot để phát hiện sớm nếu backend đổi câu chữ):

| `message` (khớp chính xác câu trong `AuthServiceImpl`) | UI |
|---|---|
| `"Email hoặc mật khẩu không chính xác."` | Lỗi chung dưới form, không phải Alert |
| Chứa `"chưa được xác thực email"` | Alert kèm nút **"Xác thực ngay"** → `/verify-email?email=…` (tự gọi `resend-verification` trước khi chuyển trang) |
| Chứa `"đã bị khóa"` | Alert: "Tài khoản đã bị khóa. Vui lòng liên hệ ban quản trị." |
| khác / không khớp | Alert chung: "Tài khoản chưa thể đăng nhập. Vui lòng liên hệ hỗ trợ." |

> ⚠️ Cách phân loại theo chuỗi `message` là hành vi thật của API (không có mã lỗi số riêng) — dễ vỡ nếu backend đổi câu chữ tiếng Việt (vd rút gọn, sửa chính tả). Viết test snapshot cho các message này để phát hiện sớm khi backend thay đổi.

### 3.3c Organizer: tài khoản do Admin cấp + bắt buộc đổi mật khẩu lần đầu

> `POST /admin/organizers` bảo vệ bằng `@PreAuthorize("hasRole('ADMIN')")` — xem [01-use-cases §Organizer](01-use-cases.md), [05-api-contract §2.9](05-api-contract.md). Không có route đăng ký nào cho Organizer.

```
Admin: POST /admin/organizers { email, fullName }
  → 201 { account: UserInfo, tempPassword }   ← Admin tự sao chép, chuyển cho Organizer qua kênh ngoài hệ thống
                                                 (Kafka/email chưa xong — xem backend technical-flows.md §0.5)

Organizer: POST /login { email, password: <tempPassword> }
  → 200, requirePasswordChange = true
  → FE CHẶN mọi điều hướng khác, redirect bắt buộc → /change-password
  → PUT /auth/change-password { currentPassword, newPassword, confirmPassword }
       ├─ 200 → server đã thu hồi refresh token + xóa cookie phía nó → FE clear() session
       │         → redirect /login?next=/organizer kèm toast "Đổi mật khẩu thành công, vui lòng đăng nhập lại"
       ├─ 401 → "Mật khẩu hiện tại không chính xác" (lỗi field currentPassword)
       └─ 400 → "Mật khẩu xác nhận không khớp" / "Mật khẩu mới phải khác mật khẩu hiện tại" (lỗi field tương ứng)
```

> ⚠️ Khác với luồng đổi mật khẩu ở nơi khác (nếu có), API này **không** tự động đăng nhập lại bằng phiên mới — nó chủ động thu hồi mọi refresh token của tài khoản (kể cả phiên vừa gọi request) và xóa cookie, buộc người dùng đăng nhập lại bằng mật khẩu mới ngay sau khi đổi thành công. FE phải xử lý theo hướng "redirect về `/login`", **không** cố gắng giữ session hiện tại.

- `RoleGuard`/layout `organizer/` kiểm tra thêm điều kiện: `user.requirePasswordChange === true` → luôn redirect `/change-password` bất kể đang cố vào route nào (trừ chính `/change-password` và `/logout`).
- `/change-password` khi ở chế độ bắt buộc: **ẩn nút "Hủy"/"Quay lại"** (không cho thoát ra ngoài mà chưa đổi mật khẩu).
- Form có 3 ô: mật khẩu hiện tại, mật khẩu mới, xác nhận mật khẩu mới — validate `confirmPassword === newPassword` ở cả client (Zod `refine`) lẫn để backend kiểm tra lại (không tin tưởng riêng client).

### 3.4 Gọi API & tự refresh
```
http(req)
  ├─ gắn Authorization: Bearer <accessToken>
  ├─ 401 ?
  │    └─ refreshOnce()        ← single-flight: let inflight: Promise | null
  │         ├─ OK  → retry req 1 lần
  │         └─ FAIL → clear(); router.replace('/login?next=…'); throw ApiError
  └─ trả data
```
Refresh chủ động (tùy chọn): timer tới `expiresAt - 60s` thì gọi refresh, tránh 401 giữa luồng checkout.

### 3.5 Đa tab
`BroadcastChannel('auth')`: khi một tab logout / login → các tab khác `clear()` hoặc chạy lại bootstrap. Refresh rotate cookie nên chỉ **một** tab nên refresh tại một thời điểm → dùng `navigator.locks.request('auth-refresh', …)` nếu có.

### 3.6 Đăng xuất
```
POST /api/auth/logout → (bất kể kết quả) clear() → queryClient.clear()
→ queueStore.clear() → broadcast('logout') → router.replace('/')
```

## 4. Middleware

```ts
// src/middleware.ts
export function middleware(req: NextRequest) {
  if (!req.cookies.has('refreshToken')) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
}
export const config = { matcher: ['/queue/:path*', '/checkout/:path*', '/payment/:path*',
                                  '/me/:path*', '/organizer/:path*', '/admin/:path*'] };
```
> Cookie chỉ nhìn thấy được vì `/api` được proxy cùng origin (ADR-01).

## 5. Checklist test
- [ ] F5 ở `/me/bookings` vẫn giữ phiên
- [ ] Access token hết hạn giữa chừng → request tự refresh, UI không nháy
- [ ] 5 request đồng thời nhận 401 → chỉ **1** lần gọi `/refresh`
- [ ] Refresh hết hạn → về `/login?next=` và quay lại đúng trang sau khi đăng nhập
- [ ] `next=//evil.com` bị bỏ qua
- [ ] Logout ở tab A → tab B chuyển trạng thái anonymous
- [ ] ORGANIZER truy cập `/admin` → `/403`
- [ ] Đăng ký customer → không tự đăng nhập → vào `/verify-email` → nhập đúng OTP → tự đăng nhập → `/`
- [ ] Nhập sai OTP → lỗi hiển thị dưới ô nhập, không mất giá trị email
- [ ] OTP hết hạn (chờ quá 5 phút) → lỗi rõ ràng + gợi ý bấm "Gửi lại mã"
- [ ] Bấm "Gửi lại mã" 2 lần liên tiếp trong 60s → nút bị disable, không gọi API lần 2
- [ ] Login tài khoản Customer `PENDING` → alert đúng loại (xác thực email) kèm nút "Xác thực ngay"
- [ ] Form đăng ký **không có** lựa chọn role/Organizer
- [ ] Organizer login lần đầu (mật khẩu tạm, `requirePasswordChange=true`) → bị ép vào `/change-password`, không vào được `/organizer` bằng cách gõ URL trực tiếp
- [ ] Đổi mật khẩu sai mật khẩu hiện tại → lỗi field `currentPassword`, không mất giá trị 2 ô còn lại
- [ ] Đổi mật khẩu với `confirmPassword` không khớp `newPassword` → lỗi ngay ở client (chưa gọi API), sau đó test cả trường hợp backend từ chối
- [ ] Đổi mật khẩu thành công → session hiện tại bị đăng xuất (cookie xóa) → redirect `/login`, đăng nhập lại bằng mật khẩu mới → vào được `/organizer`, F5 không bị ép lại `/change-password`
