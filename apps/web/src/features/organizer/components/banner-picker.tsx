"use client";

import { useEffect, useMemo } from "react";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";

/** Khớp giới hạn của catalog-service: JPEG/PNG/WEBP, tối đa 5MB. */
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

interface BannerPickerProps {
  /** Banner đã lưu trên server (khi sửa sự kiện). */
  currentUrl: string | null;
  file: File | null;
  onFileChange: (file: File | null) => void;
}

/**
 * Chọn ảnh banner — chỉ preview cục bộ, file được gửi kèm request lưu sự kiện
 * (multipart part "image"), không upload riêng.
 */
export function BannerPicker({ currentUrl, file, onFileChange }: BannerPickerProps) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;
    if (!ACCEPTED_TYPES.includes(picked.type)) {
      toast.error("Chỉ hỗ trợ ảnh JPEG, PNG hoặc WEBP.");
      return;
    }
    if (picked.size > MAX_BYTES) {
      toast.error("Ảnh banner tối đa 5MB.");
      return;
    }
    onFileChange(picked);
  }

  const shownUrl = previewUrl ?? currentUrl;

  return (
    <label className="flex aspect-video w-full max-w-sm cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-hairline bg-canvas-parchment text-ink-muted-48 transition-all duration-200 hover:border-primary">
      {shownUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- preview blob: cục bộ, next/image không tối ưu được
        <img
          src={shownUrl}
          alt="Banner preview"
          className="h-full w-full rounded-md object-cover"
        />
      ) : (
        <>
          <ImagePlus className="h-8 w-8" aria-hidden />
          <span className="text-sm">Chọn ảnh banner (JPEG/PNG/WEBP, ≤ 5MB)</span>
        </>
      )}
      <input
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={handleChange}
      />
    </label>
  );
}
