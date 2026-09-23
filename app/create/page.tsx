import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

/** Placeholder until Part C brings the template picker and editor. */
export default async function CreatePage() {
  const t = await getTranslations("dashboard");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold">{t("createNewGift")}</h1>
      <p className="text-muted-foreground">{t("comingSoon")}</p>
      <Button asChild variant="secondary">
        <Link href="/dashboard">{t("nav.dashboard")}</Link>
      </Button>
    </main>
  );
}
