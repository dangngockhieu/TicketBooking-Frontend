import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  message = "Có lỗi xảy ra, vui lòng thử lại.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-hairline px-6 py-16 text-center"
    >
      <AlertTriangle className="h-10 w-10 text-danger" aria-hidden />
      <p className="text-base font-medium text-ink">{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Thử lại
        </Button>
      ) : null}
    </div>
  );
}
