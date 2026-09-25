"use client";

import { Suspense } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/common/money";
import { DateTime } from "@/components/common/date-time";
import { PayoutStatusBadge } from "@/components/common/payout-status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientPagination } from "@/components/common/client-pagination";
import { usePageParam } from "@/lib/use-page-param";
import { RequestPayoutDialog } from "@/features/organizer/components/request-payout-dialog";
import { useMyPayoutRequests, useWallet } from "@/features/organizer/hooks";

const PAGE_SIZE = 20;

export default function OrganizerWalletPage() {
  return (
    <Suspense>
      <OrganizerWalletContent />
    </Suspense>
  );
}

function OrganizerWalletContent() {
  const { page, setPage } = usePageParam();
  const {
    data: wallet,
    isLoading: isWalletLoading,
    isError: isWalletError,
    refetch: refetchWallet,
  } = useWallet();
  const {
    data: requests,
    isLoading: isRequestsLoading,
    isError: isRequestsError,
    refetch: refetchRequests,
  } = useMyPayoutRequests({ page, size: PAGE_SIZE });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ví của tôi"
        description="Tiền tự động về trong 7 ngày sau khi sự kiện kết thúc. Cần gấp hơn? Gửi yêu cầu rút sớm bên dưới."
        action={wallet ? <RequestPayoutDialog availableBalance={wallet.availableBalance} /> : null}
      />

      {isWalletLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : isWalletError || !wallet ? (
        <ErrorState onRetry={() => refetchWallet()} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-sm text-ink-muted-48">Số dư khả dụng</p>
            <Money
              amount={wallet.availableBalance}
              className="mt-1 text-xl font-semibold text-ink"
            />
          </Card>
          <Card className="p-4">
            <p className="text-sm text-ink-muted-48">Đang chờ xử lý</p>
            <Money amount={wallet.pendingPayout} className="mt-1 text-xl font-semibold text-ink" />
          </Card>
          <Card className="p-4">
            <p className="text-sm text-ink-muted-48">Đã rút từ trước</p>
            <Money amount={wallet.totalWithdrawn} className="mt-1 text-xl font-semibold text-ink" />
          </Card>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-ink">Lịch sử yêu cầu rút tiền</h2>
        {isRequestsLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : isRequestsError ? (
          <ErrorState onRetry={() => refetchRequests()} />
        ) : requests && requests.items.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-hairline bg-canvas">
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="bg-canvas-parchment text-left text-ink-muted-48">
                <tr>
                  <th className="px-4 py-3">Ngày yêu cầu</th>
                  <th className="px-4 py-3">Nguồn</th>
                  <th className="px-4 py-3">Số tiền</th>
                  <th className="px-4 py-3">Ngân hàng</th>
                  <th className="px-4 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {requests.items.map((request) => (
                  <tr key={request.id} className="border-t border-hairline">
                    <td className="px-4 py-3">
                      <DateTime iso={request.createdAt} />
                    </td>
                    <td className="px-4 py-3 text-ink-muted-48">
                      {request.source === "AUTO" ? "Tự động" : "Yêu cầu sớm"}
                      {request.eventTitle ? (
                        <p className="max-w-40 truncate text-xs">{request.eventTitle}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <Money amount={request.amount} />
                    </td>
                    <td className="px-4 py-3 text-ink-muted-48">
                      {request.bankAccount.bankName} · {request.bankAccount.accountNumber}
                    </td>
                    <td className="px-4 py-3">
                      <PayoutStatusBadge status={request.status} />
                      {(request.status === "REJECTED" || request.status === "HOLD") &&
                      request.reason ? (
                        <p className="mt-1 text-xs text-danger">{request.reason}</p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Chưa có yêu cầu rút tiền nào" />
        )}

        {requests ? (
          <ClientPagination page={page} totalPages={requests.totalPages} onPageChange={setPage} />
        ) : null}
      </div>
    </div>
  );
}
