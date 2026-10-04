"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("LocaleSwitcher");

  return (
    <nav aria-label={t("label")} className="flex items-center gap-2 text-sm">
      {routing.locales.map((item) => {
        const active = item === locale;
        return (
          <Link
            key={item}
            href={pathname}
            locale={item}
            className={
              active
                ? "font-semibold text-foreground"
                : "text-foreground/50 underline underline-offset-4 hover:opacity-70"
            }
            aria-current={active ? "true" : undefined}
          >
            {t(item)}
          </Link>
        );
      })}
    </nav>
  );
}
