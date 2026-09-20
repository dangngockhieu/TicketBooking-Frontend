# 09 — UI & Design System

## 1. Nguyên tắc

1. **Rõ ràng trong áp lực**: luồng mua vé (chọn vé → phòng chờ → checkout) tối giản, một hành động chính mỗi màn, luôn hiển thị thời gian còn lại.
2. **Trạng thái đầy đủ**: mọi khối dữ liệu có đủ `loading` (skeleton) · `empty` · `error` (có nút thử lại) · `success`.
3. **Mobile-first**: khách mua vé và organizer check-in chủ yếu trên điện thoại.
4. **Nhất quán**: chỉ dùng token, không hard-code màu/khoảng cách.

## 2. Design tokens (CSS variables — theo quy ước shadcn)

```css
:root {
  --background: 0 0% 100%;      --foreground: 222 47% 11%;
  --primary: 262 83% 58%;       --primary-foreground: 0 0% 100%;   /* tím thương hiệu (placeholder) */
  --secondary: 220 14% 96%;     --muted: 220 14% 96%;  --muted-foreground: 220 9% 46%;
  --success: 142 71% 36%;       --warning: 38 92% 50%;  --danger: 0 72% 51%;  --info: 199 89% 48%;
  --border: 220 13% 91%;        --ring: 262 83% 58%;
  --radius: 0.75rem;
}
.dark { --background: 222 47% 7%; --foreground: 210 40% 98%; /* … */ }
```
- Typography: `Be Vietnam Pro` (next/font, subset `vietnamese`) — hỗ trợ dấu tốt. Thang: 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36.
- Spacing theo Tailwind (4px grid). Breakpoints mặc định Tailwind (`sm 640`, `md 768`, `lg 1024`, `xl 1280`).
- Ảnh banner tỉ lệ **16:9**, `next/image` với `sizes` phù hợp, placeholder blur.

## 3. Component

| Nhóm | Component |
|---|---|
| shadcn/ui | Button, Input, Textarea, Select, Checkbox, RadioGroup, Dialog, AlertDialog, Sheet, DropdownMenu, Tabs, Toast (Sonner), Tooltip, Popover, Calendar, Badge, Card, Skeleton, Table, Form, Avatar, Progress, Separator |
| Common (tự viết) | `PageHeader`, `EmptyState`, `ErrorState`, `StatusBadge` (map status → label/màu, xem 01 §5), `Money` (VND), `DateTime` (vi-VN, tz VN), `Countdown`, `Pagination` (đồng bộ URL), `DataTable` (TanStack Table), `ConfirmDialog`, `ImageUpload`, `RoleGuard`, `QueryBoundary` (Suspense + ErrorBoundary) |
| Domain | `EventCard`, `EventGrid`, `EventFilters`, `CategoryChips`, `TicketSelector`, `BookingSummary`, `HoldTimer`, `QueuePosition`, `ConnectionIndicator`, `TicketQR`, `CheckInResultOverlay`, `EventForm` (multi-step), `TicketClassFieldArray`, `ReportCharts` |

## 4. Định dạng

```ts
export const formatVnd = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n); // 1.500.000 ₫
export const formatDateTime = (iso: string) =>
  formatInTimeZone(iso, 'Asia/Ho_Chi_Minh', "HH:mm, EEEE dd/MM/yyyy", { locale: vi });
```

## 5. Form

- React Hook Form + `zodResolver`; schema đặt ở `features/*/schemas.ts`, message tiếng Việt.
- Lỗi server `errors` (field → message) → `setError(field, { message })`.
- Nút submit hiện spinner + disable khi pending; hiển thị lỗi tổng ở đầu form (`role="alert"`).
- Form dài (Event) có cảnh báo khi rời trang chưa lưu; tự lưu nháp vào `localStorage` (không chứa dữ liệu nhạy cảm).

## 6. Accessibility

- Contrast ≥ 4.5:1; focus ring rõ (`--ring`); toàn bộ thao tác làm được bằng bàn phím.
- Countdown & vị trí hàng chờ dùng `aria-live`; không chỉ dùng màu để biểu thị trạng thái (kèm icon/chữ).
- `prefers-reduced-motion`: tắt nhấp nháy đồng hồ, animation carousel.
- Ảnh có `alt` (banner: tên sự kiện).

## 7. Biểu đồ báo cáo (UC-O4)

- KPI tiles: Doanh thu, Vé đã bán / tổng, Tỷ lệ lấp đầy, Tỷ lệ check-in.
- Bar chart theo hạng vé (sold vs total), line chart `salesByDay`, bảng chi tiết `byTicketClass`.
- Recharts, màu lấy từ token; có bảng dữ liệu thay thế cho screen reader.
