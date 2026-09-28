import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Bird } from "@/components/brand/lovebirds";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("accountDeleted");
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function AccountDeletedPage() {
  const t = await getTranslations("accountDeleted");
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-20 text-center">
      <div className="w-full max-w-44">
        <Bird variant="blue" />
      </div>
      <h1 className="font-display text-3xl font-semibold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("text")}</p>
      <Button asChild variant="secondary">
        <Link href="/">{t("home")}</Link>
      </Button>
    </div>
  );
}
