"use client";

import { usePaymentHistory } from "@/features/payment/hooks";
import { Money } from "@/components/common/money";
import { DateTime } from "@/components/common/date-time";
import { StatusBadge } from "@/components/common/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";

export default function PaymentHistoryPage() {
  const { data, isLoading, isError, refetch } = usePaymentHistory({ page: 1, size: 20 });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-ink">Lịch sử giao dịch</h1>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data && data.items.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-hairline">
          <table className="w-full min-w-[32rem] text-sm">
            <thead className="bg-canvas-parchment text-left text-ink-muted-48">
              <tr>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">Phương thức</th>
                <th className="px-4 py-3">Số tiền</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((tx) => (
                <tr key={tx.id} className="border-t border-hairline">
                  <td className="px-4 py-3">
                    <DateTime iso={tx.createdAt} />
                  </td>
                  <td className="px-4 py-3">{tx.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <Money amount={tx.amount} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={
                        tx.status === "SUCCESS"
                          ? "PAID"
                          : tx.status === "REFUNDED"
                            ? "REFUNDED"
                            : "CANCELLED"
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Chưa có giao dịch nào" />
      )}
    </div>
  );
}
