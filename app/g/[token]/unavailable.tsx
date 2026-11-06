import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";

/** Shown for unknown, unpublished, regenerated or deleted links. Same page for all, on purpose. */
export async function GiftUnavailable() {
  const t = await getTranslations("gift");
  return (
    <StatusPage title={t("unavailableTitle")} text={t("unavailableText")} logo className="min-h-svh">
      <Button asChild variant="soft">
        <Link href="/">{t("goHome")}</Link>
      </Button>
    </StatusPage>
  );
}
