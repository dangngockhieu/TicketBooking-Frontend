"use client";

import { useEffect } from "react";
import { AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <AlertOctagon className="h-14 w-14 text-danger" aria-hidden />
      <h1 className="text-2xl font-semibold text-ink">Có lỗi xảy ra</h1>
      <p className="text-sm text-ink-muted-48">Vui lòng thử lại sau ít phút.</p>
      <Button onClick={reset}>Thử lại</Button>
    </div>
  );
}
