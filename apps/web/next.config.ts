import path from "node:path";
import type { NextConfig } from "next";

const apiProxyTarget = process.env.API_PROXY_TARGET ?? "http://localhost:8080";

// Domain ảnh banner sự kiện (storage service của backend), phân tách bằng dấu phẩy.
// Cấu hình qua env để không phải sửa code khi backend đổi/thêm domain lưu trữ ảnh.
const imageHostnames = (process.env.NEXT_PUBLIC_IMAGE_HOSTNAMES ?? "picsum.photos")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  output: "standalone",
  // Monorepo: gốc để trace file cho bản standalone phải là gốc workspace, không phải apps/web.
  outputFileTracingRoot: path.join(__dirname, "../.."),
  // Tắt tự sinh AGENTS.md/CLAUDE.md ở gốc repo — đã có .claude/CLAUDE.md riêng.
  agentRules: false,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${apiProxyTarget}/api/:path*` },
      // Banner sự kiện: backend trả bannerUrl dạng "/uploads/events/<file>" (catalog-service
      // lưu trên đĩa) — proxy cùng origin để <img>/next/image dùng thẳng path tương đối.
      { source: "/uploads/:path*", destination: `${apiProxyTarget}/uploads/:path*` },
    ];
  },
  images: {
    remotePatterns: imageHostnames.map((hostname) => ({ protocol: "https" as const, hostname })),
  },
};

export default nextConfig;
