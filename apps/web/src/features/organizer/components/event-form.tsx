"use client";
import { EventDetail, UpsertEventRequest, fallbackErrorMessage } from "@ticketbooking/shared";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Money } from "@/components/common/money";
import { useCategories } from "@/features/events/hooks";
import { useUploadBanner } from "@/features/organizer/hooks";
import {
  eventFormSchema,
  defaultEventFormValues,
  type EventFormInput,
} from "@/features/organizer/schemas";
import { cn } from "@/lib/utils";

const STEPS = ["Thông tin cơ bản", "Hạng vé", "Thời gian bán", "Xem lại"] as const;

function toDatetimeLocal(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toEventFormInput(event: EventDetail): EventFormInput {
  return {
    title: event.title,
    categoryId: event.category.id,
    description: event.description ?? "",
    location: event.location,
    venueName: event.venueName ?? "",
    bannerUrl: event.bannerUrl ?? "",
    startTime: toDatetimeLocal(event.startTime),
    endTime: toDatetimeLocal(event.endTime),
    saleStartTime: toDatetimeLocal(event.saleStartTime ?? ""),
    saleEndTime: toDatetimeLocal(event.saleEndTime ?? ""),
    ticketClasses: event.ticketClasses.map((tc) => ({
      id: tc.id,
      name: tc.name,
      description: tc.description ?? "",
      price: String(tc.price),
      totalQuantity: String(tc.totalQuantity),
    })),
  };
}

interface EventFormProps {
  initialEvent?: EventDetail;
  onSave: (body: UpsertEventRequest) => Promise<{ id: string }>;
  onPublish?: (eventId: string) => Promise<void>;
  isSaving: boolean;
  isPublishing?: boolean;
}

export function EventForm({
  initialEvent,
  onSave,
  onPublish,
  isSaving,
  isPublishing,
}: EventFormProps) {
  const router = useRouter();
  const { data: categories } = useCategories();
  const uploadBanner = useUploadBanner();
  const [step, setStep] = useState(0);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<EventFormInput>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: initialEvent ? toEventFormInput(initialEvent) : defaultEventFormValues,
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: "ticketClasses" });
  const values = useWatch({ control });

  const STEP_FIELDS: (keyof EventFormInput)[][] = [
    ["title", "categoryId", "location", "startTime", "endTime"],
    ["ticketClasses"],
    ["saleStartTime", "saleEndTime"],
    [],
  ];

  async function goNext() {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function toRequest(data: EventFormInput): UpsertEventRequest {
    return {
      categoryId: data.categoryId,
      title: data.title,
      description: data.description || null,
      location: data.location,
      venueName: data.venueName || null,
      bannerUrl: data.bannerUrl || null,
      startTime: new Date(data.startTime).toISOString(),
      endTime: new Date(data.endTime).toISOString(),
      saleStartTime: new Date(data.saleStartTime).toISOString(),
      saleEndTime: new Date(data.saleEndTime).toISOString(),
      ticketClasses: data.ticketClasses.map((tc, i) => ({
        id: tc.id,
        name: tc.name,
        description: tc.description || null,
        price: Number(tc.price),
        totalQuantity: Number(tc.totalQuantity),
        sortOrder: i,
      })),
    };
  }

  async function handleSaveDraft(data: EventFormInput) {
    try {
      const saved = await onSave(toRequest(data));
      toast.success("Đã lưu nháp");
      router.push(`/organizer/events/${saved.id}/edit`);
    } catch (err) {
      toast.error(fallbackErrorMessage(err));
    }
  }

  async function handlePublish(data: EventFormInput) {
    try {
      const saved = await onSave(toRequest(data));
      if (onPublish) await onPublish(saved.id);
      toast.success("Đã publish sự kiện");
      router.push("/organizer/events");
    } catch (err) {
      toast.error(fallbackErrorMessage(err));
    }
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadBanner.mutateAsync(file);
      setValue("bannerUrl", res.url);
    } catch (err) {
      toast.error(fallbackErrorMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                i === step
                  ? "bg-primary text-on-primary"
                  : i < step
                    ? "bg-success text-on-primary"
                    : "bg-canvas-parchment text-ink-muted-48",
              )}
            >
              {i + 1}
            </span>
            <span className={i === step ? "font-medium text-ink" : "text-ink-muted-48"}>
              {label}
            </span>
            {i < STEPS.length - 1 ? <span className="mx-1 text-ink-muted-48">─</span> : null}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Tên sự kiện *</Label>
            <Input id="title" {...register("title")} />
            {errors.title ? <p className="text-sm text-danger">{errors.title.message}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="categoryId">Danh mục *</Label>
            <select
              id="categoryId"
              {...register("categoryId")}
              className="h-11 rounded-md border border-hairline bg-canvas px-3 text-[15px] text-ink outline-none focus-visible:border-primary"
            >
              <option value="">-- Chọn danh mục --</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId ? (
              <p className="text-sm text-danger">{errors.categoryId.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea id="description" {...register("description")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Địa điểm *</Label>
            <Input id="location" placeholder="Hà Nội, TP.HCM…" {...register("location")} />
            {errors.location ? (
              <p className="text-sm text-danger">{errors.location.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="venueName">Tên địa điểm tổ chức</Label>
            <Input id="venueName" placeholder="SVĐ Mỹ Đình…" {...register("venueName")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Banner (tỉ lệ 16:9)</Label>
            <label className="flex aspect-video w-full max-w-sm cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-hairline bg-canvas-parchment text-ink-muted-48 hover:border-primary">
              {values.bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- preview ảnh vừa upload, không cần tối ưu next/image
                <img
                  src={values.bannerUrl}
                  alt="Banner preview"
                  className="h-full w-full rounded-md object-cover"
                />
              ) : (
                <>
                  <ImagePlus className="h-8 w-8" aria-hidden />
                  <span className="text-sm">
                    {uploadBanner.isPending ? "Đang tải lên…" : "Chọn ảnh banner"}
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerChange}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startTime">Bắt đầu *</Label>
              <Input id="startTime" type="datetime-local" {...register("startTime")} />
              {errors.startTime ? (
                <p className="text-sm text-danger">{errors.startTime.message}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="endTime">Kết thúc *</Label>
              <Input id="endTime" type="datetime-local" {...register("endTime")} />
              {errors.endTime ? (
                <p className="text-sm text-danger">{errors.endTime.message}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="flex flex-col gap-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-1 gap-3 rounded-md border border-hairline p-4 sm:grid-cols-[1fr_1fr_140px_140px_auto]"
            >
              <div className="flex flex-col gap-1">
                <Label>Tên *</Label>
                <Input {...register(`ticketClasses.${index}.name`)} />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Mô tả</Label>
                <Input {...register(`ticketClasses.${index}.description`)} />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Giá *</Label>
                <Input type="number" min={0} {...register(`ticketClasses.${index}.price`)} />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Số lượng *</Label>
                <Input
                  type="number"
                  min={1}
                  {...register(`ticketClasses.${index}.totalQuantity`)}
                />
              </div>
              <div className="flex items-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                  aria-label="Di chuyển lên"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, index + 1)}
                  aria-label="Di chuyển xuống"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                  aria-label="Xóa hạng vé"
                >
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </div>
              {errors.ticketClasses?.[index] ? (
                <p className="col-span-full text-sm text-danger">
                  {[
                    errors.ticketClasses[index]?.name?.message,
                    errors.ticketClasses[index]?.price?.message,
                    errors.ticketClasses[index]?.totalQuantity?.message,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              ) : null}
            </div>
          ))}
          {typeof errors.ticketClasses?.message === "string" ? (
            <p className="text-sm text-danger">{errors.ticketClasses.message}</p>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            onClick={() => append({ name: "", description: "", price: "0", totalQuantity: "1" })}
          >
            + Thêm hạng vé
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="saleStartTime">Mở bán *</Label>
            <Input id="saleStartTime" type="datetime-local" {...register("saleStartTime")} />
            {errors.saleStartTime ? (
              <p className="text-sm text-danger">{errors.saleStartTime.message}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="saleEndTime">Đóng bán *</Label>
            <Input id="saleEndTime" type="datetime-local" {...register("saleEndTime")} />
            {errors.saleEndTime ? (
              <p className="text-sm text-danger">{errors.saleEndTime.message}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="flex flex-col gap-4 rounded-lg border border-hairline bg-canvas p-6">
          <h3 className="text-lg font-semibold text-ink">{values.title || "(Chưa có tên)"}</h3>
          <p className="text-sm text-ink-muted-48">{values.location}</p>
          <div className="flex flex-col gap-2">
            {(values.ticketClasses ?? []).map((tc, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{tc.name}</span>
                <span>
                  <Money amount={Number(tc.price) || 0} /> · {tc.totalQuantity} vé
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex justify-between border-t border-hairline pt-4">
        <Button type="button" variant="secondary" onClick={goBack} disabled={step === 0}>
          Quay lại
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={goNext}>
            Tiếp theo
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleSubmit(handleSaveDraft)}
              disabled={isSaving}
            >
              {isSaving ? "Đang lưu…" : "Lưu nháp"}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit(handlePublish)}
              disabled={isSaving || isPublishing}
            >
              {isPublishing ? "Đang publish…" : "Lưu & Publish"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
