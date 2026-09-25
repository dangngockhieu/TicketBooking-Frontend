import { z } from "zod";

/**
 * Schema riêng cho mobile — không dùng chung với apps/web/src/features/auth/schemas.ts
 * (quyết định có chủ đích, xem .claude/CLAUDE.md). Rule hiện khớp với web vì UX
 * chưa khác biệt, có thể tách rời sau nếu form mobile cần validate khác.
 */
export const loginSchema = z.object({
  email: z.string().min(1, "Vui lòng nhập email").email("Email không đúng định dạng"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.string().min(1, "Vui lòng nhập email").email("Email không đúng định dạng"),
    password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;
