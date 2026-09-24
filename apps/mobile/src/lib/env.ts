import { z } from "zod";

/**
 * Biến môi trường được validate ngay khi module này được import lần đầu.
 * Sai/thiếu biến sẽ throw ngay lúc build/start thay vì lỗi mơ hồ lúc runtime.
 * Expo inline biến `EXPO_PUBLIC_*` tại build-time — không có rewrite proxy như
 * web (next.config.ts), nên đây phải là URL đầy đủ tới API Gateway.
 */
const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url().default("http://localhost:8080"),
  EXPO_PUBLIC_WS_URL: z.string().default("ws://localhost:8080/ws/queue"),
});

const parsed = envSchema.safeParse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_WS_URL: process.env.EXPO_PUBLIC_WS_URL,
});

if (!parsed.success) {
  console.error("❌ Biến môi trường không hợp lệ:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
