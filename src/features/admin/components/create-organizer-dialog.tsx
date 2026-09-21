"use client";

import { useState } from "react";
import { Copy, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCreateOrganizerAccount } from "@/features/admin/hooks";
import { fallbackErrorMessage } from "@/lib/error-messages";
import { ApiError } from "@/types/api";

/**
 * tempPassword chỉ được trả về MỘT LẦN trong response — server không lưu bản rõ.
 * F5 hay load lại danh sách sẽ không thấy lại được. Xem docs/05-api-contract.md §2.9.
 */
export function CreateOrganizerDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);
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
      setCreated({ email: res.account.email, tempPassword: res.tempPassword });
    } catch (err) {
      if (err instanceof ApiError && err.httpStatus === 409) {
        setEmailError(err.message);
        return;
      }
      toast.error(fallbackErrorMessage(err));
    }
  }

  function copyPassword() {
    if (created) {
      navigator.clipboard.writeText(created.tempPassword).then(() => toast.success("Đã sao chép mật khẩu tạm"));
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
              <DialogDescription>{created.email}</DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex flex-col gap-3 rounded-md border border-warning/40 bg-warning/10 p-4">
              <p className="flex items-start gap-2 text-sm text-ink">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                Mật khẩu tạm chỉ hiển thị một lần. Hãy sao chép và gửi cho Organizer ngay bây giờ.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md bg-canvas px-3 py-2 font-mono text-sm">{created.tempPassword}</code>
                <Button type="button" variant="secondary" size="icon" onClick={copyPassword} aria-label="Sao chép mật khẩu">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Đóng</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Tạo tài khoản Organizer</DialogTitle>
              <DialogDescription>Hệ thống sẽ sinh mật khẩu tạm, Organizer bắt buộc đổi ở lần đăng nhập đầu.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="org-email">Email</Label>
                <Input id="org-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                {emailError ? <p className="text-sm text-danger">{emailError}</p> : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="org-fullname">Họ tên</Label>
                <Input id="org-fullname" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
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
