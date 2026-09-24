"use client";
import { ApiError, fallbackErrorMessage } from "@ticketbooking/shared";

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
import { Money } from "@/components/common/money";
import { useCreatePayoutRequest } from "@/features/organizer/hooks";

export function RequestPayoutDialog({ availableBalance }: { availableBalance: number }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createPayout = useCreatePayoutRequest();

  function reset() {
    setAmount("");
    setBankName("");
    setAccountNumber("");
    setAccountHolderName("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createPayout.mutateAsync({
        amount: Number(amount),
        bankAccount: { bankName, accountNumber, accountHolderName },
      });
      toast.success("Đã gửi yêu cầu rút tiền, chờ Admin duyệt.");
      setOpen(false);
      reset();
    } catch (err) {
      if (err instanceof ApiError && (err.httpStatus === 409 || err.httpStatus === 400)) {
        setError(err.message);
        return;
      }
      toast.error(fallbackErrorMessage(err));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={availableBalance <= 0}>Yêu cầu rút tiền</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Yêu cầu rút tiền</DialogTitle>
            <DialogDescription>
              Số dư khả dụng: <Money amount={availableBalance} />. Admin sẽ duyệt và chuyển khoản
              thủ công.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-4">
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="payout-amount">Số tiền muốn rút (VNĐ)</Label>
              <Input
                id="payout-amount"
                type="number"
                min={1}
                max={availableBalance}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="payout-bank">Ngân hàng</Label>
              <Input
                id="payout-bank"
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="payout-account">Số tài khoản</Label>
              <Input
                id="payout-account"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="payout-holder">Tên chủ tài khoản</Label>
              <Input
                id="payout-holder"
                required
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createPayout.isPending}>
              {createPayout.isPending ? "Đang gửi…" : "Gửi yêu cầu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
