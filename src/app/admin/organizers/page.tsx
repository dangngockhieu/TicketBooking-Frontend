"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/common/status-badge";
import { DateTime } from "@/components/common/date-time";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useOrganizerAccounts } from "@/features/admin/hooks";
import { CreateOrganizerDialog } from "@/features/admin/components/create-organizer-dialog";
import { AccountStatusDialog } from "@/features/admin/components/account-status-dialog";
import type { AccountStatus } from "@/types/api";

const TABS: { label: string; value: AccountStatus | undefined }[] = [
  { label: "Tất cả", value: undefined },
  { label: "Hoạt động", value: "ACTIVE" },
  { label: "Đã khóa", value: "LOCKED" },
];

export default function AdminOrganizersPage() {
  const [status, setStatus] = useState<AccountStatus | undefined>(undefined);
  const [keyword, setKeyword] = useState("");
  const { data, isLoading, isError, refetch } = useOrganizerAccounts({
    status,
    keyword: keyword || undefined,
    page: 1,
    size: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Tài khoản Organizer" action={<CreateOrganizerDialog />} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2" role="tablist">
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
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm theo email…"
          className="max-w-xs"
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data && data.items.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-hairline bg-canvas">
          <table className="w-full text-sm">
            <thead className="bg-canvas-parchment text-left text-ink-muted-48">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((account) => (
                <tr key={account.id} className="border-t border-hairline">
                  <td className="px-4 py-3 font-medium text-ink">{account.email}</td>
                  <td className="px-4 py-3">
                    <DateTime iso={account.createdAt} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={account.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <AccountStatusDialog account={account} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Chưa có tài khoản Organizer nào" />
      )}
    </div>
  );
}
