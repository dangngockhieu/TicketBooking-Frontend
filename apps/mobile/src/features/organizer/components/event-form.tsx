import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react-native";
import {
  fallbackErrorMessage,
  formatVnd,
  type EventDetail,
  type UpsertEventRequest,
} from "@ticketbooking/shared";
import { TextField } from "@/components/text-field";
import { DateTimeField } from "@/features/organizer/components/datetime-field";
import { useCategories } from "@/features/events/hooks";
import { useUploadBanner } from "@/features/organizer/hooks";
import {
  eventFormSchema,
  defaultEventFormValues,
  type EventFormInput,
} from "@/features/organizer/schemas";

const STEPS = ["Thông tin cơ bản", "Hạng vé", "Thời gian bán", "Xem lại"] as const;

function toEventFormInput(event: EventDetail): EventFormInput {
  return {
    title: event.title,
    categoryId: event.category.id,
    description: event.description ?? "",
    location: event.location,
    venueName: event.venueName ?? "",
    bannerUrl: event.bannerUrl ?? "",
    startTime: event.startTime,
    endTime: event.endTime,
    saleStartTime: event.saleStartTime ?? "",
    saleEndTime: event.saleEndTime ?? "",
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
  onDone: (savedEventId: string, published: boolean) => void;
  isSaving: boolean;
  isPublishing?: boolean;
}

export function EventForm({
  initialEvent,
  onSave,
  onPublish,
  onDone,
  isSaving,
  isPublishing,
}: EventFormProps) {
  const { data: categories } = useCategories();
  const uploadBanner = useUploadBanner();
  const [step, setStep] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const {
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
    setFormError(null);
    try {
      const saved = await onSave(toRequest(data));
      onDone(saved.id, false);
    } catch (err) {
      setFormError(fallbackErrorMessage(err));
    }
  }

  async function handlePublish(data: EventFormInput) {
    setFormError(null);
    try {
      const saved = await onSave(toRequest(data));
      if (onPublish) await onPublish(saved.id);
      onDone(saved.id, true);
    } catch (err) {
      setFormError(fallbackErrorMessage(err));
    }
  }

  async function handlePickBanner() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError("Cần quyền truy cập thư viện ảnh để chọn banner.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      aspect: [16, 9],
      quality: 0.8,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      const res = await uploadBanner.mutateAsync(result.assets[0].uri);
      setValue("bannerUrl", res.url);
    } catch (err) {
      setFormError(fallbackErrorMessage(err));
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.stepsRow}>
          {STEPS.map((label, i) => (
            <View key={label} style={styles.stepItem}>
              <View
                style={[
                  styles.stepBadge,
                  i === step
                    ? styles.stepBadgeActive
                    : i < step
                      ? styles.stepBadgeDone
                      : styles.stepBadgePending,
                ]}
              >
                <Text
                  style={[
                    styles.stepBadgeText,
                    i <= step ? styles.stepBadgeTextActive : styles.stepBadgeTextPending,
                  ]}
                >
                  {i + 1}
                </Text>
              </View>
              <Text style={i === step ? styles.stepLabelActive : styles.stepLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        {step === 0 ? (
          <View style={styles.section}>
            <Controller
              control={control}
              name="title"
              render={({ field }) => (
                <TextField
                  label="Tên sự kiện *"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={errors.title?.message}
                />
              )}
            />

            <View style={styles.group}>
              <Text style={styles.label}>Danh mục *</Text>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <View style={styles.chipsRow}>
                    {categories?.map((c) => {
                      const active = field.value === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[styles.chip, active ? styles.chipActive : null]}
                          onPress={() => field.onChange(c.id)}
                        >
                          <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>
                            {c.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              />
              {errors.categoryId ? (
                <Text style={styles.error}>{errors.categoryId.message}</Text>
              ) : null}
            </View>

            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <TextField
                  label="Mô tả"
                  value={field.value}
                  onChangeText={field.onChange}
                  multiline
                  numberOfLines={4}
                  style={styles.textarea}
                />
              )}
            />

            <Controller
              control={control}
              name="location"
              render={({ field }) => (
                <TextField
                  label="Địa điểm *"
                  placeholder="Hà Nội, TP.HCM…"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={errors.location?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="venueName"
              render={({ field }) => (
                <TextField
                  label="Tên địa điểm tổ chức"
                  placeholder="SVĐ Mỹ Đình…"
                  value={field.value}
                  onChangeText={field.onChange}
                />
              )}
            />

            <View style={styles.group}>
              <Text style={styles.label}>Banner (tỉ lệ 16:9)</Text>
              <TouchableOpacity style={styles.bannerPicker} onPress={handlePickBanner}>
                {values.bannerUrl ? (
                  <Image source={{ uri: values.bannerUrl }} style={styles.bannerPreview} />
                ) : (
                  <View style={styles.bannerPlaceholder}>
                    <ImagePlus size={28} color="#8e8e93" />
                    <Text style={styles.bannerPlaceholderText}>
                      {uploadBanner.isPending ? "Đang tải lên…" : "Chọn ảnh banner"}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <Controller
              control={control}
              name="startTime"
              render={({ field }) => (
                <DateTimeField
                  label="Bắt đầu *"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.startTime?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="endTime"
              render={({ field }) => (
                <DateTimeField
                  label="Kết thúc *"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.endTime?.message}
                />
              )}
            />
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.section}>
            {fields.map((f, index) => (
              <View key={f.id} style={styles.ticketCard}>
                <Controller
                  control={control}
                  name={`ticketClasses.${index}.name`}
                  render={({ field }) => (
                    <TextField label="Tên *" value={field.value} onChangeText={field.onChange} />
                  )}
                />
                <Controller
                  control={control}
                  name={`ticketClasses.${index}.description`}
                  render={({ field }) => (
                    <TextField
                      label="Mô tả"
                      value={field.value ?? ""}
                      onChangeText={field.onChange}
                    />
                  )}
                />
                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Controller
                      control={control}
                      name={`ticketClasses.${index}.price`}
                      render={({ field }) => (
                        <TextField
                          label="Giá *"
                          keyboardType="numeric"
                          value={field.value}
                          onChangeText={field.onChange}
                        />
                      )}
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Controller
                      control={control}
                      name={`ticketClasses.${index}.totalQuantity`}
                      render={({ field }) => (
                        <TextField
                          label="Số lượng *"
                          keyboardType="numeric"
                          value={field.value}
                          onChangeText={field.onChange}
                        />
                      )}
                    />
                  </View>
                </View>
                {errors.ticketClasses?.[index] ? (
                  <Text style={styles.error}>
                    {[
                      errors.ticketClasses[index]?.name?.message,
                      errors.ticketClasses[index]?.price?.message,
                      errors.ticketClasses[index]?.totalQuantity?.message,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                ) : null}
                <View style={styles.ticketActions}>
                  <TouchableOpacity
                    style={[styles.iconButton, index === 0 ? styles.iconButtonDisabled : null]}
                    disabled={index === 0}
                    onPress={() => move(index, index - 1)}
                  >
                    <ArrowUp size={16} color={index === 0 ? "#c7c7cc" : "#1d1d1f"} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.iconButton,
                      index === fields.length - 1 ? styles.iconButtonDisabled : null,
                    ]}
                    disabled={index === fields.length - 1}
                    onPress={() => move(index, index + 1)}
                  >
                    <ArrowDown
                      size={16}
                      color={index === fields.length - 1 ? "#c7c7cc" : "#1d1d1f"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.iconButton,
                      fields.length === 1 ? styles.iconButtonDisabled : null,
                    ]}
                    disabled={fields.length === 1}
                    onPress={() => remove(index)}
                  >
                    <Trash2 size={16} color={fields.length === 1 ? "#c7c7cc" : "#d92d20"} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {typeof errors.ticketClasses?.message === "string" ? (
              <Text style={styles.error}>{errors.ticketClasses.message}</Text>
            ) : null}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => append({ name: "", description: "", price: "0", totalQuantity: "1" })}
            >
              <Text style={styles.secondaryButtonText}>+ Thêm hạng vé</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.section}>
            <Controller
              control={control}
              name="saleStartTime"
              render={({ field }) => (
                <DateTimeField
                  label="Mở bán *"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.saleStartTime?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="saleEndTime"
              render={({ field }) => (
                <DateTimeField
                  label="Đóng bán *"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.saleEndTime?.message}
                />
              )}
            />
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.reviewCard}>
            {values.bannerUrl ? (
              <Image source={{ uri: values.bannerUrl }} style={styles.reviewBanner} />
            ) : null}
            <Text style={styles.reviewTitle}>{values.title || "(Chưa có tên)"}</Text>
            <Text style={styles.reviewMeta}>{values.location}</Text>
            {values.description ? (
              <Text style={styles.reviewMeta}>{values.description}</Text>
            ) : null}
            <Text style={styles.reviewMeta}>
              Bắt đầu: {values.startTime ? new Date(values.startTime).toLocaleString("vi-VN") : "—"}
            </Text>
            <Text style={styles.reviewMeta}>
              Mở bán:{" "}
              {values.saleStartTime ? new Date(values.saleStartTime).toLocaleString("vi-VN") : "—"}
              {" — Đóng bán: "}
              {values.saleEndTime ? new Date(values.saleEndTime).toLocaleString("vi-VN") : "—"}
            </Text>
            <View style={styles.reviewTicketList}>
              {(values.ticketClasses ?? []).map((tc, i) => (
                <View key={i} style={styles.reviewTicketRow}>
                  <Text style={styles.reviewMeta}>{tc?.name}</Text>
                  <Text style={styles.reviewMeta}>
                    {formatVnd(Number(tc?.price) || 0)} · {tc?.totalQuantity} vé
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, step === 0 ? styles.disabled : null]}
            disabled={step === 0}
            onPress={goBack}
          >
            <Text style={styles.secondaryButtonText}>Quay lại</Text>
          </TouchableOpacity>

          {step < STEPS.length - 1 ? (
            <TouchableOpacity style={styles.primaryButton} onPress={goNext}>
              <Text style={styles.primaryButtonText}>Tiếp theo</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.secondaryButton, isSaving ? styles.disabled : null]}
                disabled={isSaving}
                onPress={handleSubmit(handleSaveDraft)}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Text style={styles.secondaryButtonText}>Lưu nháp</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, isSaving || isPublishing ? styles.disabled : null]}
                disabled={isSaving || isPublishing}
                onPress={handleSubmit(handlePublish)}
              >
                {isPublishing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Lưu & Publish</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 16, gap: 20, paddingBottom: 40 },
  stepsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stepItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeActive: { backgroundColor: "#4f46e5" },
  stepBadgeDone: { backgroundColor: "#059669" },
  stepBadgePending: { backgroundColor: "#f2f2f7" },
  stepBadgeText: { fontSize: 11, fontWeight: "700" },
  stepBadgeTextActive: { color: "#fff" },
  stepBadgeTextPending: { color: "#8e8e93" },
  stepLabel: { fontSize: 13, color: "#8e8e93" },
  stepLabelActive: { fontSize: 13, fontWeight: "600", color: "#1d1d1f" },
  formError: { fontSize: 13, color: "#d92d20" },
  section: { gap: 14 },
  group: { gap: 6 },
  label: { fontSize: 14, fontWeight: "500", color: "#1d1d1f" },
  error: { fontSize: 13, color: "#d92d20" },
  textarea: { height: 96, textAlignVertical: "top", paddingTop: 12 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  chipText: { fontSize: 13, fontWeight: "500", color: "#1d1d1f" },
  chipTextActive: { color: "#fff" },
  bannerPicker: {
    aspectRatio: 16 / 9,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#d1d1d6",
    overflow: "hidden",
  },
  bannerPreview: { width: "100%", height: "100%" },
  bannerPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  bannerPlaceholderText: { fontSize: 13, color: "#8e8e93" },
  ticketCard: {
    gap: 10,
    borderWidth: 1,
    borderColor: "#e5e5ea",
    borderRadius: 10,
    padding: 12,
  },
  row: { flexDirection: "row", gap: 10 },
  flex1: { flex: 1 },
  ticketActions: { flexDirection: "row", justifyContent: "flex-end", gap: 6 },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d1d1d6",
  },
  iconButtonDisabled: { opacity: 0.4 },
  reviewCard: {
    gap: 10,
    borderWidth: 1,
    borderColor: "#e5e5ea",
    borderRadius: 12,
    padding: 16,
  },
  reviewBanner: { width: "100%", aspectRatio: 16 / 9, borderRadius: 8 },
  reviewTitle: { fontSize: 17, fontWeight: "700", color: "#1d1d1f" },
  reviewMeta: { fontSize: 13, color: "#6b6b70" },
  reviewTicketList: { gap: 4, marginTop: 4 },
  reviewTicketRow: { flexDirection: "row", justifyContent: "space-between" },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e5ea",
    paddingTop: 16,
  },
  primaryButton: {
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  secondaryButton: {
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { fontSize: 14, fontWeight: "600", color: "#1d1d1f" },
  disabled: { opacity: 0.5 },
});
