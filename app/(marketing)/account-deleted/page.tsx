import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("accountDeleted");
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function AccountDeletedPage() {
  const t = await getTranslations("accountDeleted");
  return (
    <StatusPage bird="blue" title={t("title")} text={t("text")} className="py-20">
      <Button asChild variant="secondary">
        <Link href="/">{t("home")}</Link>
      </Button>
    </StatusPage>
  );
}
