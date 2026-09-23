import { z } from "zod";

/**
 * Biến môi trường được validate ngay khi module này được import lần đầu.
 * Sai/thiếu biến sẽ throw ngay lúc build/start thay vì lỗi mơ hồ lúc runtime.
 */
const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:8080"),
  NEXT_PUBLIC_WS_URL: z.string().default("ws://localhost:8080/ws/queue"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!parsed.success) {
  console.error("❌ Biến môi trường không hợp lệ:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
