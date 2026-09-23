/**
 * Conventional Commits với scope theo docs/CONVENTIONS.md §3.
 */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      [
        "auth",
        "catalog",
        "booking",
        "payment",
        "queue",
        "organizer",
        "admin",
        "ui",
        "infra",
        "docs",
        "mobile",
        "shared",
      ],
    ],
    "scope-empty": [1, "never"],
  },
};

export default config;
