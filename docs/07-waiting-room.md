# 08 — Virtual Waiting Room Client (UC-C4, UC-S2)

> Backend: `../TicketBooking/docs/virtual-waiting-room.md`. Toàn bộ giao tiếp gói trong interface `QueueClient` để đổi transport không ảnh hưởng UI.

## 1. Giao thức (đề xuất chốt với backend)

| Mục | Giá trị |
|---|---|
| Endpoint | `NEXT_PUBLIC_WS_URL` (vd `ws://localhost:4010/ws/queue`, prod `wss://api…/ws/queue`) |
| CONNECT headers | `Authorization: Bearer <accessToken>`, `eventId: <uuid>` |
| STOMP heart-beat | `10000,10000` (client gửi 10s; server coi mất kết nối sau 15s) |
| Subscribe | `/user/queue/position` → `QueueMessage` (xem [05-api-contract §2.7](05-api-contract.md#27-queue-)) |
| Heartbeat ứng dụng | `SEND /app/queue.heartbeat` body `{ eventId }` mỗi 10s (song song STOMP heart-beat, để server gia hạn key Redis `queue:heartbeat`) |
| Rời hàng | `SEND /app/queue.leave` body `{ eventId }` rồi `DISCONNECT` |

## 2. `QueueClient`

```ts
export interface QueueClient {
  connect(opts: { eventId: string; getAccessToken: () => string | null }): void;
  leave(): void;
  disconnect(): void;
  on(listener: (e: QueueClientEvent) => void): () => void;
}

export type QueueClientEvent =
  | { kind: 'connection'; state: 'connecting' | 'connected' | 'reconnecting' | 'closed' }
  | { kind: 'message'; message: QueueMessage };
```
Triển khai: `StompQueueClient` (`@stomp/stompjs`, `reconnectDelay` tùy chỉnh), `beforeConnect` lấy access token mới nhất (đã refresh nếu cần).

## 3. State machine của trang `/queue/[eventId]`

```
            ┌──────────┐ connect  ┌────────────┐ POSITION_UPDATE ┌─────────┐
  mount ───►│ checking │─────────►│ connecting │────────────────►│ waiting │◄──┐
            └────┬─────┘          └─────┬──────┘                 └──┬──┬───┘   │ POSITION_UPDATE
                 │ queueEnabled=false   │ lỗi                       │  │ ──────┘
                 ▼                      ▼                           │  │ socket drop
           redirect /events/[id]   ┌─────────────┐  ≤ 15s ok        │  ▼
           (tiếp tục mua)          │ reconnecting│◄─────────────────┘ ┌─────────────┐
                                   └──────┬──────┘                    │ reconnecting│
                                          │ > 15s / REMOVED            └─────────────┘
                                          ▼
                                     ┌─────────┐        ADMITTED        ┌──────────┐
                                     │  lost   │   waiting ───────────► │ admitted │
                                     └─────────┘                        └────┬─────┘
                               [Vào lại hàng chờ]         lưu token → tạo booking từ giỏ
                                                          hoặc về /events/[id] chọn vé
```

## 4. Quy tắc

- **Queue token**: `queueStore.set(eventId, { token, expiresAt: serverTime.now() + expiresInSeconds*1000 })` + `sessionStorage` (sống qua F5 trong cùng tab, không chia sẻ tab khác). Gửi qua header `X-Queue-Token` khi `POST /bookings`. Hết hạn → xóa.
- **Vào lại khi đã có token còn hạn** → bỏ qua phòng chờ.
- **Reconnect**: backoff 1s → 2s → 4s (tối đa 3 lần trong cửa sổ 15s); sau đó trạng thái `lost`.
- **Tab ẩn** (`visibilitychange`): vẫn giữ kết nối (trình duyệt có thể throttle timer ~1 phút → STOMP heart-beat do thư viện quản lý; khuyến nghị backend dung sai ≥ 15s như thiết kế). Hiển thị cảnh báo "Giữ tab này mở".
- **`beforeunload`**: hỏi xác nhận khi đang `waiting`. Khi thật sự rời → `leave()` best-effort (`navigator.sendBeacon` không dùng được cho WS → chấp nhận server tự loại sau 15s).
- **Nhiều tab cùng sự kiện**: `BroadcastChannel('queue:'+eventId)` — tab mới phát hiện tab cũ đang chờ → hiển thị "Bạn đang chờ ở tab khác" thay vì tạo kết nối thứ hai (server có thể chỉ giữ một vị trí/user).
- **ADMITTED**: thông báo nổi bật + `document.title = '🎟 Đến lượt bạn!'` + Notification API (nếu được cấp quyền), tự chuyển trang sau 3s.
- **A11y**: vị trí cập nhật trong vùng `aria-live="polite"`, throttle đọc tối đa 1 lần/30s.

## 5. UI

- Vị trí `#4.523`, progress bar = `1 - position / initialPosition`, ETA dạng "~ 9 phút" (làm tròn, không nhảy từng giây).
- Chỉ báo kết nối: ● xanh Đã kết nối / ● vàng Đang kết nối lại / ● đỏ Mất kết nối.
- Nút **Rời hàng chờ** (xác nhận).

## 6. Test

- E2E: vào sự kiện đang bật phòng chờ → thấy vị trí giảm → ADMITTED → tạo booking thành công với `X-Queue-Token`.
- E2E: ngắt kết nối mạng giữa chừng → hiện "Đang kết nối lại" → kết nối lại, giữ vị trí.
- Unit: reducer state machine với chuỗi event giả.
