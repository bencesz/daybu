import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Home() {
  const t = useTranslations("Home");

  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-6">
      <Link
        href="/reference"
        className="text-lg text-foreground underline underline-offset-4 hover:opacity-70"
      >
        {t("referenceLink")}
      </Link>
    </main>
  );
}
