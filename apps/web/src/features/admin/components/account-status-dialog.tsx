"use client";
import { AccountSummary, fallbackErrorMessage } from "@ticketbooking/shared";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { useUpdateAccountStatus } from "@/features/admin/hooks";

export function AccountStatusDialog({ account }: { account: AccountSummary }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const updateStatus = useUpdateAccountStatus();
  const nextStatus = account.status === "LOCKED" ? "ACTIVE" : "LOCKED";
  const isLocking = nextStatus === "LOCKED";

  async function handleConfirm() {
    try {
      await updateStatus.mutateAsync({
        accountId: account.id,
        body: { status: nextStatus, reason: reason || undefined },
      });
      toast.success(isLocking ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản");
      setOpen(false);
      setReason("");
    } catch (err) {
      toast.error(fallbackErrorMessage(err));
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={isLocking ? "danger" : "secondary"} size="sm">
          {isLocking ? "Khóa" : "Mở khóa"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isLocking ? "Khóa tài khoản" : "Mở khóa tài khoản"}</AlertDialogTitle>
          <AlertDialogDescription>{account.email}</AlertDialogDescription>
        </AlertDialogHeader>
        {isLocking ? (
          <div className="mt-2 flex flex-col gap-1.5">
            <Label htmlFor="lock-reason">Lý do (tùy chọn)</Label>
            <Textarea id="lock-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={updateStatus.isPending}>
            {updateStatus.isPending ? "Đang xử lý…" : "Xác nhận"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
