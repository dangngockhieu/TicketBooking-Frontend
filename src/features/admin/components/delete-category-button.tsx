"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDeleteCategory } from "@/features/admin/hooks";
import { ApiError } from "@/types/api";
import { fallbackErrorMessage } from "@/lib/error-messages";
import type { Category } from "@/types/api";

export function DeleteCategoryButton({ category }: { category: Category }) {
  const [open, setOpen] = useState(false);
  const deleteCategory = useDeleteCategory();

  async function handleConfirm() {
    try {
      await deleteCategory.mutateAsync(category.id);
      toast.success("Đã xóa danh mục");
      setOpen(false);
    } catch (err) {
      if (err instanceof ApiError && err.httpStatus === 409) {
        toast.error(err.message || "Danh mục đang được sự kiện sử dụng, không thể xóa.");
        setOpen(false);
        return;
      }
      toast.error(fallbackErrorMessage(err));
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Xóa danh mục ${category.name}`}>
          <Trash2 className="h-4 w-4 text-danger" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa danh mục &quot;{category.name}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            Không thể hoàn tác. Nếu danh mục đang được sự kiện nào đó sử dụng, thao tác sẽ bị từ chối.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleteCategory.isPending}>
            {deleteCategory.isPending ? "Đang xóa…" : "Xóa"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
