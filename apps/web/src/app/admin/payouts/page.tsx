"use client";

import { useState } from "react";
import { PauseCircle } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/common/money";
import { DateTime } from "@/components/common/date-time";
import { PayoutStatusBadge } from "@/components/common/payout-status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAllPayoutRequests } from "@/features/admin/hooks";
import { PayoutActionDialog } from "@/features/admin/components/payout-action-dialog";
import type { PayoutRequestStatus } from "@ticketbooking/shared";

const TABS: { label: string; value: PayoutRequestStatus | undefined }[] = [
  { label: "Tất cả", value: undefined },
  { label: "Chờ duyệt", value: "PENDING" },
  { label: "Đã duyệt", value: "APPROVED" },
  { label: "Tạm giữ", value: "HOLD" },
  { label: "Đã chi trả", value: "PAID" },
  { label: "Đã từ chối", value: "REJECTED" },
];

export default function AdminPayoutsPage() {
  const [status, setStatus] = useState<PayoutRequestStatus | undefined>("PENDING");
  const { data, isLoading, isError, refetch } = useAllPayoutRequests({ status, page: 1, size: 50 });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Yêu cầu rút tiền"
        description="Tự động phát sinh 7 ngày sau sự kiện kết thúc, hoặc Organizer chủ động xin sớm hơn. Duyệt, tự chuyển khoản ngoài hệ thống, rồi đánh dấu đã chi trả — hoặc tạm giữ nếu nghi ngờ gian lận."
      />

      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            role="tab"
            aria-selected={status === tab.value}
            onClick={() => setStatus(tab.value)}
            className={cn(
              "rounded-pill px-4 py-2 text-sm font-medium",
              status === tab.value
                ? "bg-primary text-on-primary"
                : "border border-hairline bg-canvas text-ink-muted-80",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data && data.items.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-hairline bg-canvas">
          <table className="w-full min-w-[60rem] text-sm">
            <thead className="bg-canvas-parchment text-left text-ink-muted-48">
              <tr>
                <th className="px-4 py-3">Ngày yêu cầu</th>
                <th className="px-4 py-3">Organizer</th>
                <th className="px-4 py-3">Nguồn</th>
                <th className="px-4 py-3">Số tiền</th>
                <th className="px-4 py-3">Tài khoản nhận</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((request) => (
                <tr key={request.id} className="border-t border-hairline">
                  <td className="px-4 py-3">
                    <DateTime iso={request.createdAt} />
                  </td>
                  <td className="px-4 py-3">{request.organizerEmail}</td>
                  <td className="px-4 py-3">
                    <Badge variant={request.source === "AUTO" ? "info" : "muted"}>
                      {request.source === "AUTO" ? "Tự động" : "Yêu cầu"}
                    </Badge>
                    {request.eventTitle ? (
                      <p className="mt-1 max-w-40 truncate text-xs text-ink-muted-48">
                        {request.eventTitle}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">
                    <Money amount={request.amount} />
                  </td>
                  <td className="px-4 py-3 text-ink-muted-48">
                    {request.bankAccount.bankName} · {request.bankAccount.accountNumber}
                    <br />
                    {request.bankAccount.accountHolderName}
                  </td>
                  <td className="px-4 py-3">
                    <PayoutStatusBadge status={request.status} />
                    {request.status === "HOLD" && request.reason ? (
                      <p className="mt-1 max-w-52 text-xs text-danger">{request.reason}</p>
                    ) : null}
                    {request.status === "REJECTED" && request.reason ? (
                      <p className="mt-1 max-w-52 text-xs text-danger">{request.reason}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {request.status === "PENDING" ? (
                        <>
                          <PayoutActionDialog
                            request={request}
                            action="APPROVED"
                            trigger={
                              <Button size="sm" variant="secondary">
                                Duyệt
                              </Button>
                            }
                          />
                          <PayoutActionDialog
                            request={request}
                            action="REJECTED"
                            trigger={
                              <Button size="sm" variant="danger">
                                Từ chối
                              </Button>
                            }
                          />
                        </>
                      ) : null}
                      {request.status === "APPROVED" ? (
                        <PayoutActionDialog
                          request={request}
                          action="PAID"
                          trigger={<Button size="sm">Đã chuyển khoản</Button>}
                        />
                      ) : null}
                      {request.status === "HOLD" ? (
                        <PayoutActionDialog
                          request={request}
                          action="PENDING"
                          trigger={
                            <Button size="sm" variant="secondary">
                              Mở lại
                            </Button>
                          }
                        />
                      ) : request.status !== "PAID" && request.status !== "REJECTED" ? (
                        <PayoutActionDialog
                          request={request}
                          action="HOLD"
                          trigger={
                            <Button size="sm" variant="ghost" className="gap-1 text-danger">
                              <PauseCircle className="h-3.5 w-3.5" aria-hidden />
                              Tạm giữ
                            </Button>
                          }
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Không có yêu cầu nào" />
      )}
    </div>
  );
}
