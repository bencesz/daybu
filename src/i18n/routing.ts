import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pl", "en"],
  defaultLocale: "pl",
  localePrefix: "as-needed",
  // Keep PL on `/` unless the user explicitly switches to EN.
  localeDetection: false,
});
