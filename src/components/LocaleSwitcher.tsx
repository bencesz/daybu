"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

function hrefForLocale(locale: string, pathname: string) {
  if (locale === routing.defaultLocale) {
    return pathname || "/";
  }

  return `/${locale}${pathname === "/" ? "" : pathname}`;
}

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("LocaleSwitcher");

  return (
    <nav aria-label={t("label")} className="flex items-center gap-2 text-sm">
      {routing.locales.map((item) => {
        const active = item === locale;
        return (
          <a
            key={item}
            href={hrefForLocale(item, pathname)}
            hrefLang={item}
            className={
              active
                ? "font-semibold text-foreground"
                : "text-foreground/50 underline underline-offset-4 hover:opacity-70"
            }
            aria-current={active ? "page" : undefined}
          >
            {t(item)}
          </a>
        );
      })}
    </nav>
  );
}
