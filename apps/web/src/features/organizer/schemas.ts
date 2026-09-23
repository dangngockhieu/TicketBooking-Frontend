import { z } from "zod";

const numericString = (message: string) =>
  z.string().refine((v) => v !== "" && !Number.isNaN(Number(v)), { message });

export const ticketClassSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Vui lòng nhập tên hạng vé"),
  description: z.string().optional(),
  price: numericString("Giá phải là số").refine((v) => Number(v) >= 0, "Giá phải ≥ 0"),
  totalQuantity: numericString("Số lượng phải là số").refine(
    (v) => Number.isInteger(Number(v)) && Number(v) >= 1,
    "Số lượng phải ≥ 1",
  ),
});
export type TicketClassFormInput = z.infer<typeof ticketClassSchema>;

export const eventFormSchema = z
  .object({
    title: z.string().min(1, "Vui lòng nhập tên sự kiện"),
    categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
    description: z.string().optional(),
    location: z.string().min(1, "Vui lòng nhập địa điểm"),
    venueName: z.string().optional(),
    bannerUrl: z.string().optional(),
    startTime: z.string().min(1, "Vui lòng chọn thời gian bắt đầu"),
    endTime: z.string().min(1, "Vui lòng chọn thời gian kết thúc"),
    saleStartTime: z.string().min(1, "Vui lòng chọn thời gian mở bán"),
    saleEndTime: z.string().min(1, "Vui lòng chọn thời gian đóng bán"),
    ticketClasses: z.array(ticketClassSchema).min(1, "Cần ít nhất một hạng vé"),
  })
  .refine((data) => new Date(data.saleStartTime) < new Date(data.saleEndTime), {
    message: "Thời gian mở bán phải trước thời gian đóng bán",
    path: ["saleEndTime"],
  })
  .refine((data) => new Date(data.saleEndTime) <= new Date(data.startTime), {
    message: "Thời gian đóng bán phải trước hoặc bằng thời gian bắt đầu sự kiện",
    path: ["saleEndTime"],
  })
  .refine((data) => new Date(data.startTime) < new Date(data.endTime), {
    message: "Thời gian bắt đầu phải trước thời gian kết thúc",
    path: ["endTime"],
  });

export type EventFormInput = z.infer<typeof eventFormSchema>;

export const defaultEventFormValues: EventFormInput = {
  title: "",
  categoryId: "",
  description: "",
  location: "",
  venueName: "",
  bannerUrl: "",
  startTime: "",
  endTime: "",
  saleStartTime: "",
  saleEndTime: "",
  ticketClasses: [{ name: "", description: "", price: "0", totalQuantity: "1" }],
};
