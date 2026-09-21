"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { Camera, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCheckIn } from "@/features/organizer/hooks";
import { ApiError } from "@/types/api";
import { formatTime } from "@/lib/format";

const DUPLICATE_DEBOUNCE_MS = 3000;

interface CheckInResultView {
  ok: boolean;
  title: string;
  detail: string;
}

export function CheckInScanner({ eventId }: { eventId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const lastCodeRef = useRef<{ code: string; at: number } | null>(null);
  const checkIn = useCheckIn();

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<CheckInResultView | null>(null);
  const [history, setHistory] = useState<{ valid: number; rejected: number }>({ valid: 0, rejected: 0 });

  async function processCode(code: string) {
    const now = Date.now();
    if (lastCodeRef.current && lastCodeRef.current.code === code && now - lastCodeRef.current.at < DUPLICATE_DEBOUNCE_MS) {
      return; // bỏ qua mã vừa quét lặp lại trong 3s
    }
    lastCodeRef.current = { code, at: now };

    try {
      const res = await checkIn.mutateAsync({ qrCodeData: code, eventId });
      setResult({ ok: true, title: "HỢP LỆ", detail: `${res.ticketClass} · ${res.customerName}` });
      setHistory((h) => ({ ...h, valid: h.valid + 1 }));
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(100);
      setTimeout(() => setResult(null), 2000);
    } catch (err) {
      let detail = "Không thể check-in vé này.";
      if (err instanceof ApiError) {
        if (err.httpStatus === 409 && err.message.toLowerCase().includes("đã được check-in")) {
          detail = `ĐÃ CHECK-IN lúc ${formatTime(new Date().toISOString())}`;
        } else {
          detail = err.message;
        }
      }
      setResult({ ok: false, title: "TỪ CHỐI", detail });
      setHistory((h) => ({ ...h, rejected: h.rejected + 1 }));
    }
  }

  useEffect(() => {
    const reader = new BrowserQRCodeReader();
    let cancelled = false;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (scanResult, error, controls) => {
        controlsRef.current = controls;
        if (scanResult) processCode(scanResult.getText());
        // NotFoundException ném liên tục khi chưa thấy mã — bỏ qua, không phải lỗi thật.
        if (error && error.name !== "NotFoundException" && !cancelled) {
          setCameraError("Không thể mở camera. Vui lòng cấp quyền camera hoặc dùng nhập mã thủ công.");
        }
      })
      .catch(() => {
        if (!cancelled) setCameraError("Không thể mở camera. Vui lòng cấp quyền camera hoặc dùng nhập mã thủ công.");
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ khởi tạo camera một lần khi mount
  }, [eventId]);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualCode.trim()) {
      processCode(manualCode.trim());
      setManualCode("");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 p-4 text-center text-white">
            <Camera className="h-8 w-8" aria-hidden />
            <p className="text-sm">{cameraError}</p>
          </div>
        ) : null}
        {result ? (
          <div
            role="status"
            className={`absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-white ${
              result.ok ? "bg-success/90" : "bg-danger/90"
            }`}
          >
            {result.ok ? <CheckCircle2 className="h-12 w-12" aria-hidden /> : <XCircle className="h-12 w-12" aria-hidden />}
            <p className="text-lg font-semibold">{result.title}</p>
            <p className="text-sm">{result.detail}</p>
          </div>
        ) : null}
      </div>

      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <Input
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Nhập mã vé thủ công"
          aria-label="Nhập mã vé thủ công"
        />
        <Button type="submit">Kiểm tra</Button>
      </form>

      <p className="text-sm text-ink-muted-48">
        Lịch sử phiên: <span className="font-medium text-success">{history.valid} hợp lệ</span> ·{" "}
        <span className="font-medium text-danger">{history.rejected} từ chối</span>
      </p>
    </div>
  );
}
