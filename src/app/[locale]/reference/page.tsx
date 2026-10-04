import { useTranslations } from "next-intl";

export default function ReferencePage() {
  const t = useTranslations("Reference");

  return (
    <main className="flex min-h-full flex-1 flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-end gap-3 pr-20">
        <a
          href="/reference.pdf"
          download="reference.pdf"
          className="text-sm font-medium text-foreground underline underline-offset-4 hover:opacity-70"
        >
          {t("download")}
        </a>
      </div>

      <div className="relative min-h-[70vh] flex-1 overflow-hidden rounded border border-black/10 bg-black/[.03] dark:border-white/15 dark:bg-white/[.04]">
        <iframe
          title={t("pdfTitle")}
          src="/reference.pdf"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>

      <p className="text-center text-sm text-foreground/60 sm:hidden">
        {t("mobileFallback")}
      </p>
    </main>
  );
}
