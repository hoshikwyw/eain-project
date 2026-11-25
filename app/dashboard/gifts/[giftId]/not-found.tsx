import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";

/**
 * A gift that was deleted (or is not this creator's), reached from an old
 * notification or link. Shown inside the app frame, so the creator stays
 * where they were instead of landing on the public site looking signed out.
 */
export default async function GiftNotFound() {
  const t = await getTranslations("dashboard.giftGone");
  return (
    <StatusPage title={t("title")} text={t("text")}>
      <Button asChild>
        <Link href="/dashboard/gifts">{t("back")}</Link>
      </Button>
    </StatusPage>
  );
}
