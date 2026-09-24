# 09 — Testing Strategy

## 1. Tầng test

| Tầng                    | Công cụ                                                                                                              | Phạm vi                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Unit                    | Vitest                                                                                                               | `lib/*` (format, server-time, http-client refresh single-flight), reducer queue, Zod schema |
| Component / Integration | Vitest + Testing Library + `@testing-library/user-event` + MSW (intercept fetch trong test, không chạy server riêng) | Form login/register, TicketSelector, Countdown, EventFilters ↔ URL, CheckInResult           |
| E2E                     | Playwright (Chromium + WebKit mobile viewport)                                                                       | Luồng use case end-to-end, chạy trên backend thật (môi trường test/staging)                 |
| A11y                    | `@axe-core/playwright`                                                                                               | Các trang chính                                                                             |

E2E chạy với `docker compose up -d` (repo `TicketBooking`) + seed data test cố định (tài khoản, sự kiện, hạng vé — xem §2). MoMo dùng **MoMo Sandbox (Test Environment)** thật; các test phụ thuộc kết quả thanh toán (E4, E5) cần tài khoản test sandbox và có thể chạy chậm hơn do round-trip thật.

## 2. Seed data test (chuẩn bị trước ở môi trường E2E)

| Loại      | Cố định                                                                                                                                                                                                                                                                                      |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tài khoản | `customer@test.vn` (CUSTOMER, ACTIVE), `pending-verify@test.vn` (CUSTOMER, PENDING — chưa xác thực), `locked@test.vn` (CUSTOMER, LOCKED), `organizer@test.vn` (ORGANIZER, ACTIVE), `admin@test.vn` (ADMIN, ACTIVE) — mật khẩu thống nhất trong file cấu hình E2E, không hard-code trong test |
| Sự kiện   | Ít nhất: 1 sự kiện đang bán bình thường, 1 sự kiện sắp hết vé (còn 2 vé một hạng), 1 sự kiện đã bật phòng chờ ảo, 1 sự kiện đã diễn ra (có báo cáo + vé đã check-in)                                                                                                                         |
| Danh mục  | Đủ để test lọc, và ít nhất 1 danh mục không gắn sự kiện nào (test xóa)                                                                                                                                                                                                                       |

## 3. E2E bắt buộc (mỗi case ↔ UC)

| #    | Kịch bản                                                                                                                                                                                          | UC         |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| E1   | Đăng ký customer → nhập đúng OTP ở `/verify-email` (đọc từ log server test/email test) → tự đăng nhập → F5 vẫn đăng nhập → đăng xuất                                                              | C1         |
| E1b  | Đăng ký customer → nhập sai OTP → lỗi rõ ràng, không mất giá trị → nhập đúng → thành công                                                                                                         | C1         |
| E1c  | OTP hết hạn (chờ đủ 5 phút hoặc rút ngắn TTL ở môi trường test) → verify báo hết hạn → bấm "Gửi lại mã" → cooldown 60s hiện đúng → nhập OTP mới → thành công                                      | C1         |
| E2   | Login sai mật khẩu; login `locked@test.vn` / `pending-verify@test.vn` → cả 3 case đều HTTP 401 nhưng UI hiện đúng thông báo theo `message` (sai mật khẩu / bị khóa / chờ xác thực email)          | C1         |
| E3   | Tìm "concert", lọc theo danh mục + địa điểm → URL đúng → back giữ bộ lọc → phân trang                                                                                                             | C2         |
| E4   | Chọn 2 vé hạng VIP → checkout → thanh toán MoMo Sandbox thành công → trang kết quả poll tới khi `PAID` → xem vé có QR                                                                             | C5, C6, C7 |
| E5   | Thanh toán MoMo thất bại/hủy → trang kết quả thất bại → Thanh toán lại thành công                                                                                                                 | C6         |
| E6   | Vào checkout chờ hết giờ giữ chỗ (10 phút hoặc rút ngắn ở môi trường test) → dialog hết hạn → đơn `CANCELLED`                                                                                     | C5, S1     |
| E7   | Hủy đơn đang giữ chỗ → số vé còn lại tăng lại                                                                                                                                                     | C5         |
| E8   | Chọn số lượng vượt quá số còn lại ở sự kiện sắp hết vé → 409 "Chỉ còn N vé" → số lượng tự sửa                                                                                                     | C5         |
| E9   | Vào sự kiện đã bật phòng chờ → thấy vị trí giảm dần → ADMITTED → tạo booking thành công với `X-Queue-Token`                                                                                       | C4         |
| E10  | Ngắt mạng giữa chừng khi đang trong hàng chờ → reconnect → vẫn giữ vị trí                                                                                                                         | C4, S2     |
| E11  | Chưa login bấm Mua vé → login → quay lại đúng sự kiện, giỏ còn nguyên                                                                                                                             | C1, C5     |
| E12  | Organizer tạo sự kiện 3 hạng vé + banner → lưu nháp → publish → xuất hiện ở `/events`                                                                                                             | O1, O2     |
| E13  | Organizer check-in bằng nhập mã thủ công: lần 1 hợp lệ, lần 2 "đã check-in"                                                                                                                       | O3         |
| E14  | Organizer xem report sự kiện đã diễn ra (KPI + chart render)                                                                                                                                      | O4         |
| E15  | Admin tạo tài khoản Organizer mới (`POST /admin/organizers`) → nhận `tempPassword` hiển thị 1 lần → organizer đăng nhập được ngay                                                                 | A1         |
| E15b | Organizer login lần đầu bằng mật khẩu tạm → bị ép vào `/change-password` → cố gõ URL `/organizer` trực tiếp vẫn bị redirect → đổi mật khẩu thành công → vào được `/organizer`, F5 không bị ép lại | A1, O*     |
| E16  | Admin CRUD danh mục; xóa danh mục đang dùng → 409                                                                                                                                                 | A2         |
| E17  | CUSTOMER vào `/organizer` → 403; chưa login vào `/me/bookings` → `/login?next=`                                                                                                                   | RBAC       |
| E18  | Access token hết hạn giữa phiên (rút ngắn thời hạn ở môi trường test) → request tự refresh ngầm, không văng ra login                                                                              | C1         |
| E19  | Đơn `REFUNDED` hiển thị đúng ở kết quả và danh sách đơn (kích hoạt Saga rollback ở môi trường test)                                                                                               | S4         |

Mỗi test tự dọn dữ liệu nó tạo ra (hoặc chạy trên tài khoản/sự kiện riêng theo worker) để chạy song song an toàn — không có endpoint reset toàn cục, nên cần thiết kế test độc lập theo dữ liệu, không theo trạng thái toàn hệ thống.

## 4. Ngưỡng

- Coverage `lib/` + `features/*/hooks|schemas` ≥ 80% (không ép coverage cho component UI thuần).
- CI chặn merge nếu: `lint`, `typecheck`, `test`, `build`, `e2e (chromium)` fail.
- Lighthouse CI (trang `/`, trang chi tiết một sự kiện cố định): Performance ≥ 85, SEO ≥ 90, A11y ≥ 90.
