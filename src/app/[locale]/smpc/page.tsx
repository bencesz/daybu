import { useTranslations } from "next-intl";
import Link from "next/link";

export default function SmpcPage() {
  const t = useTranslations("Smpc");

  return (
    <main className="flex min-h-full flex-1 flex-col">
      <div className="relative min-h-[70vh] flex-1 overflow-hidden bg-black/3 dark:bg-white/4">
        <iframe
          title={t("pdfTitle")}
          src="/SmPC.pdf"
          className="absolute inset-0 h-full w-full border-0"
        >
        </iframe>
      </div>

      <p className="text-center text-sm text-foreground/60 sm:hidden">
        {t("mobileFallback")}{" "}
        <Link
          href="/SmPC.pdf"
          download="SmPC.pdf"
          className="font-medium text-foreground underline underline-offset-4 hover:opacity-70"
        >
          {t("download")}
        </Link>
      </p>
    </main>
  );
}
