import { useTranslations } from "next-intl";

export default function SmpcPage() {
  const t = useTranslations("Smpc");

  return (
    <main className="flex min-h-full flex-1 flex-col">
      <div className="relative min-h-[70vh] flex-1 overflow-hidden rounded border border-black/10 bg-black/3 dark:border-white/15 dark:bg-white/4">
        <iframe
          title={t("pdfTitle")}
          src="/SmPC.pdf"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>

      <p className="text-center text-sm text-foreground/60 sm:hidden">
        {t("mobileFallback")}{" "}
        <a
          href="/SmPC.pdf"
          download="SmPC.pdf"
          className="font-medium text-foreground underline underline-offset-4 hover:opacity-70"
        >
          {t("download")}
        </a>
      </p>
    </main>
  );
}
