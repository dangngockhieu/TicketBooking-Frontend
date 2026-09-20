# Conventions

## 1. Code

- TypeScript `strict`, `noUncheckedIndexedAccess`; **không** dùng `any` (dùng `unknown` + narrow).
- Mặc định là Server Component; chỉ thêm `'use client'` ở component lá cần state/effect/browser API.
- Không gọi `fetch` trực tiếp trong component client → dùng hook trong `features/*/hooks.ts` (bọc TanStack Query) → `features/*/api.ts` → `lib/http-client.ts`.
- Mỗi feature có `index.ts` export public; không import sâu vào feature khác.
- Không lưu access token / PII vào `localStorage`.
- Tiền, ngày giờ luôn qua `lib/format.ts`; thời gian "bây giờ" cho nghiệp vụ (đếm ngược) luôn qua `serverTime.now()`.

## 2. Đặt tên

| Loại | Quy ước | Ví dụ |
|---|---|---|
| File component | `kebab-case.tsx`, export `PascalCase` | `ticket-selector.tsx` → `TicketSelector` |
| Hook | `useXxx` trong `hooks.ts` hoặc `use-xxx.ts` | `useCreateBooking` |
| API function | động từ + danh từ | `getEvent`, `createBooking`, `publishEvent` |
| Zod schema | `xxxSchema`, type `XxxInput = z.infer<…>` | `loginSchema`, `LoginInput` |
| Query key | qua `qk.*` trong `lib/query-keys.ts` | `qk.event(id)` |
| Route segment | kebab-case | `/check-in`, `/organizer-submitted` |
| Env | `NEXT_PUBLIC_*` chỉ cho giá trị được lộ ra client | `NEXT_PUBLIC_WS_URL` |

## 3. Git

- Nhánh: `main` (luôn deploy được) · `feat/<scope>-<mô-tả>` · `fix/…` · `chore/…` · `docs/…`.
- Commit theo Conventional Commits (giống repo backend): `feat(booking): add hold countdown`, scope ∈ `auth, catalog, booking, payment, queue, organizer, admin, ui, infra, docs`.
- PR nhỏ (< 400 dòng thay đổi nếu có thể), mô tả: UC liên quan, ảnh chụp màn hình/GIF, checklist test.

## 4. Definition of Done cho một màn hình

- [ ] Đủ trạng thái loading / empty / error / success
- [ ] Responsive 360px → 1440px
- [ ] Điều hướng được bằng bàn phím, không lỗi axe nghiêm trọng
- [ ] Lỗi API map đúng theo [05 §3](05-api-contract.md#3-xử-lý-lỗi)
- [ ] Có test (component hoặc E2E) cho luồng chính
- [ ] Không có `console.error` / warning hydration
