import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <main className="flex flex-1 flex-col">
      <StatusPage title={t("title")} text={t("text")} logo>
        <Button asChild className="rounded-full">
          <Link href="/">{t("home")}</Link>
        </Button>
      </StatusPage>
    </main>
  );
}
