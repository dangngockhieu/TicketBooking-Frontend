"use client";
import { ApiError, fallbackErrorMessage } from "@ticketbooking/shared";

import { useState } from "react";
import { MailCheck } from "lucide-react";
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
import { useCreateOrganizerAccount } from "@/features/admin/hooks";

/**
 * Server sinh mật khẩu tạm và gửi thẳng qua email cho Organizer — Admin không bao giờ
 * thấy mật khẩu này. Xem docs/04-auth-flow.md §3.3c.
 */
export function CreateOrganizerDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const createOrganizer = useCreateOrganizerAccount();

  function reset() {
    setEmail("");
    setFullName("");
    setEmailError(null);
    setCreated(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    try {
      const res = await createOrganizer.mutateAsync({ email, fullName });
      setCreated(res.account.email);
    } catch (err) {
      if (err instanceof ApiError && err.httpStatus === 409) {
        setEmailError(err.message);
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
        <Button>Tạo tài khoản Organizer</Button>
      </DialogTrigger>
      <DialogContent>
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Đã tạo tài khoản</DialogTitle>
              <DialogDescription>{created}</DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex items-start gap-2 rounded-md border border-hairline bg-canvas-parchment p-4 text-sm text-ink">
              <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <p>
                Mật khẩu tạm đã được gửi tới email <span className="font-medium">{created}</span>.
                Organizer sẽ phải đổi mật khẩu ở lần đăng nhập đầu tiên.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Đóng</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Tạo tài khoản Organizer</DialogTitle>
              <DialogDescription>
                Hệ thống sẽ sinh mật khẩu tạm và gửi qua email cho Organizer. Organizer bắt buộc đổi
                mật khẩu ở lần đăng nhập đầu.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="org-email">Email</Label>
                <Input
                  id="org-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {emailError ? <p className="text-sm text-danger">{emailError}</p> : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="org-fullname">Họ tên</Label>
                <Input
                  id="org-fullname"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createOrganizer.isPending}>
                {createOrganizer.isPending ? "Đang tạo…" : "Tạo tài khoản"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
