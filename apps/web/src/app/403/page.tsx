import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <ShieldAlert className="h-14 w-14 text-danger" aria-hidden />
      <h1 className="text-2xl font-semibold text-ink">Bạn không có quyền truy cập trang này</h1>
      <Button asChild>
        <Link href="/">Về trang chủ</Link>
      </Button>
    </div>
  );
}
