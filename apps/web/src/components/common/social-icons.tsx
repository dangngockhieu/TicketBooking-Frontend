/**
 * lucide-react (bản dùng trong repo) không còn export icon thương hiệu
 * (Facebook/Instagram/YouTube) — tự vẽ SVG dạng filled (glyph gốc của từng
 * nền tảng), nhất quán về tỉ lệ 24x24 với các icon lucide khác.
 */
import { useId, type SVGProps } from "react";

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.16 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22c4.78-.78 8.44-4.94 8.44-9.94z" />
    </svg>
  );
}

/**
 * Logo Instagram thật dùng gradient 4 màu (vàng → cam → hồng → tím), không
 * phải màu đơn — định nghĩa gradient riêng, không dùng `currentColor`.
 */
export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 24 24" fill={`url(#${gradientId})`} {...props}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#feda75" />
          <stop offset="25%" stopColor="#fa7e1e" />
          <stop offset="55%" stopColor="#d62976" />
          <stop offset="80%" stopColor="#962fbf" />
          <stop offset="100%" stopColor="#4f5bd5" />
        </linearGradient>
      </defs>
      <path d="M12 2c2.72 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.47.66.26 1.21.6 1.76 1.15.5.5.9 1.1 1.15 1.76.25.64.42 1.37.47 2.43.05 1.06.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.06-.22 1.79-.47 2.43a4.9 4.9 0 0 1-1.15 1.76 4.9 4.9 0 0 1-1.76 1.15c-.64.25-1.37.42-2.43.47-1.06.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.06-.05-1.79-.22-2.43-.47a4.9 4.9 0 0 1-1.76-1.15 4.9 4.9 0 0 1-1.15-1.76c-.25-.64-.42-1.37-.47-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.06.22-1.79.47-2.43.26-.66.6-1.21 1.15-1.76A4.9 4.9 0 0 1 5.44 2.5c.64-.25 1.37-.42 2.43-.47C8.94 2.01 9.28 2 12 2m0 1.8c-2.67 0-2.99.01-4.04.06-.87.04-1.34.18-1.65.3-.42.16-.71.35-1.02.66-.31.31-.5.6-.66 1.02-.12.31-.26.78-.3 1.65C4.29 8.75 4.28 9.06 4.28 12s.01 3.24.06 4.29c.04.87.18 1.34.3 1.65.16.42.35.71.66 1.02.31.31.6.5 1.02.66.31.12.78.26 1.65.3 1.05.05 1.36.06 4.03.06s2.99-.01 4.04-.06c.87-.04 1.34-.18 1.65-.3.42-.16.71-.35 1.02-.66.31-.31.5-.6.66-1.02.12-.31.26-.78.3-1.65.05-1.05.06-1.36.06-4.29s-.01-3.24-.06-4.29c-.04-.87-.18-1.34-.3-1.65a2.6 2.6 0 0 0-.66-1.02 2.6 2.6 0 0 0-1.02-.66c-.31-.12-.78-.26-1.65-.3C14.99 3.81 14.68 3.8 12 3.8m0 3.06a5.14 5.14 0 1 1 0 10.28 5.14 5.14 0 0 1 0-10.28m0 1.8a3.34 3.34 0 1 0 0 6.68 3.34 3.34 0 0 0 0-6.68m5.34-2.04a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0" />
    </svg>
  );
}

export function YoutubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21.58 7.2a2.75 2.75 0 0 0-1.94-1.95C17.9 4.75 12 4.75 12 4.75s-5.9 0-7.64.5A2.75 2.75 0 0 0 2.42 7.2C1.92 8.95 1.92 12 1.92 12s0 3.05.5 4.8a2.75 2.75 0 0 0 1.94 1.95c1.74.5 7.64.5 7.64.5s5.9 0 7.64-.5a2.75 2.75 0 0 0 1.94-1.95c.5-1.75.5-4.8.5-4.8s0-3.05-.5-4.8ZM9.9 15.02V8.98L15.5 12l-5.6 3.02Z" />
    </svg>
  );
}
