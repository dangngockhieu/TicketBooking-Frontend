"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUpdateEventCommission } from "@/features/admin/hooks";
import { fallbackErrorMessage } from "@/lib/error-messages";
import type { EventDetail } from "@/types/api";

/**
 * Admin đàm phán/miễn giảm phí riêng cho một sự kiện — công thức áp dụng khi
 * tính ví Organizer: phí/vé = giá vé × commissionRate + flatFeePerTicket (vé
 * 0đ luôn miễn phí). Mặc định 5% + 3.000đ khi tạo sự kiện.
 */
export function EventCommissionDialog({
  event,
  trigger,
}: {
  event: EventDetail;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [ratePercent, setRatePercent] = useState(String(event.commissionRate * 100));
  const [flatFee, setFlatFee] = useState(String(event.flatFeePerTicket));
  const updateCommission = useUpdateEventCommission();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateCommission.mutateAsync({
        eventId: event.id,
        body: { commissionRate: Number(ratePercent) / 100, flatFeePerTicket: Number(flatFee) },
      });
      toast.success("Đã cập nhật phí nền tảng cho sự kiện");
      setOpen(false);
    } catch (err) {
      toast.error(fallbackErrorMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Phí nền tảng — {event.title}</DialogTitle>
            <DialogDescription>
              Mặc định 5% + 3.000đ/vé. Sửa riêng khi có thỏa thuận đặc biệt (đối tác lớn, sự kiện
              thiện nguyện…). Vé giá 0đ luôn được miễn phí tự động.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="commission-rate">Tỷ lệ hoa hồng (%)</Label>
              <Input
                id="commission-rate"
                type="number"
                min={0}
                max={100}
                step={0.1}
                required
                value={ratePercent}
                onChange={(e) => setRatePercent(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="flat-fee">Phí cố định mỗi vé (VNĐ)</Label>
              <Input
                id="flat-fee"
                type="number"
                min={0}
                required
                value={flatFee}
                onChange={(e) => setFlatFee(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateCommission.isPending}>
              {updateCommission.isPending ? "Đang lưu…" : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
