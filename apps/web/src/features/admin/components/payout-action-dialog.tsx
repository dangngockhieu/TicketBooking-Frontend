"use client";
import { PayoutRequest, PayoutRequestStatus, fallbackErrorMessage } from "@ticketbooking/shared";

import { useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Money } from "@/components/common/money";
import { useUpdatePayoutRequestStatus } from "@/features/admin/hooks";

type PayoutAction = Extract<
  PayoutRequestStatus,
  "APPROVED" | "REJECTED" | "PAID" | "HOLD" | "PENDING"
>;

const ACTION_LABEL: Record<PayoutAction, string> = {
  APPROVED: "Duyệt yêu cầu",
  REJECTED: "Từ chối",
  PAID: "Đánh dấu đã chuyển khoản",
  HOLD: "Tạm giữ",
  PENDING: "Mở lại (bỏ tạm giữ)",
};

/** Bắt buộc nhập lý do khi từ chối hoặc tạm giữ — cần lưu vết cho các quyết định nhạy cảm về tiền. */
const REQUIRES_REASON: PayoutAction[] = ["REJECTED", "HOLD"];

export function PayoutActionDialog({
  request,
  action,
  trigger,
}: {
  request: PayoutRequest;
  action: PayoutAction;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const updateStatus = useUpdatePayoutRequestStatus();
  const reasonRequired = REQUIRES_REASON.includes(action);

  async function handleConfirm() {
    try {
      await updateStatus.mutateAsync({
        requestId: request.id,
        body: { status: action, reason: reason || undefined },
      });
      toast.success(`${ACTION_LABEL[action]} thành công`);
      setOpen(false);
      setReason("");
    } catch (err) {
      toast.error(fallbackErrorMessage(err));
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{ACTION_LABEL[action]}</AlertDialogTitle>
          <AlertDialogDescription>
            {request.organizerEmail} · <Money amount={request.amount} /> ·{" "}
            {request.bankAccount.bankName} – {request.bankAccount.accountNumber} (
            {request.bankAccount.accountHolderName})
            {action === "PAID"
              ? " — xác nhận bạn đã tự chuyển khoản số tiền này ngoài hệ thống."
              : null}
            {action === "HOLD"
              ? " — chặn không cho yêu cầu này tiếp tục xử lý cho tới khi được mở lại."
              : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {reasonRequired ? (
          <div className="mt-2 flex flex-col gap-1.5">
            <Label htmlFor="action-reason">
              Lý do {action === "HOLD" ? "tạm giữ" : "từ chối"} *
            </Label>
            <Textarea
              id="action-reason"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={updateStatus.isPending || (reasonRequired && !reason.trim())}
          >
            {updateStatus.isPending ? "Đang xử lý…" : "Xác nhận"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
