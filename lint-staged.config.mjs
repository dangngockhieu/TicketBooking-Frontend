// Monorepo: ESLint phải chạy trong thư mục app có eslint.config.mjs của nó (ESLint 9 tìm config
// theo cwd, không theo từng file), nên file của mỗi app được route qua `pnpm --filter <app> exec`.
const quote = (files) => files.map((f) => `"${f}"`).join(" ");

export default {
  "apps/web/**/*.{ts,tsx,js,jsx,mjs}": (files) => [
    `prettier --write ${quote(files)}`,
    `pnpm --filter @ticketbooking/web exec eslint --fix --max-warnings=0 ${quote(files)}`,
  ],
  "*.{json,md,css,yaml,yml}": (files) => `prettier --write ${quote(files)}`,
};
