import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <SearchX className="h-14 w-14 text-ink-muted-48" aria-hidden />
      <h1 className="text-2xl font-semibold text-ink">Không tìm thấy trang</h1>
      <p className="text-sm text-ink-muted-48">Trang bạn tìm không tồn tại hoặc đã bị xóa.</p>
      <Button asChild>
        <Link href="/">Về trang chủ</Link>
      </Button>
    </div>
  );
}
