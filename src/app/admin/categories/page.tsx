"use client";

import { Pencil, Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminCategories } from "@/features/admin/hooks";
import { CategoryDialog } from "@/features/admin/components/category-dialog";
import { DeleteCategoryButton } from "@/features/admin/components/delete-category-button";

export default function AdminCategoriesPage() {
  const { data: categories, isLoading, isError, refetch } = useAdminCategories();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Danh mục"
        action={
          <CategoryDialog
            trigger={
              <Button className="gap-2">
                <Plus className="h-4 w-4" aria-hidden />
                Thêm danh mục
              </Button>
            }
          />
        }
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : categories && categories.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-hairline bg-canvas">
          <table className="w-full min-w-[32rem] text-sm">
            <thead className="bg-canvas-parchment text-left text-ink-muted-48">
              <tr>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Mô tả</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-t border-hairline">
                  <td className="px-4 py-3 font-medium text-ink">{category.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted-48">{category.slug}</td>
                  <td className="px-4 py-3 text-ink-muted-48">{category.description || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <CategoryDialog
                        category={category}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Sửa danh mục ${category.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <DeleteCategoryButton category={category} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Chưa có danh mục nào" />
      )}
    </div>
  );
}
