import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";
import { hasSessionCookie } from "@/lib/session-hint";

/** A signed-in visitor goes back to their dashboard, not to the public home page. */
export default async function NotFound() {
  const t = await getTranslations("notFound");
  const signedIn = await hasSessionCookie();

  return (
    <main className="flex flex-1 flex-col">
      <StatusPage title={t("title")} text={t("text")} logo>
        <Button asChild>
          <Link href={signedIn ? "/dashboard" : "/"}>{signedIn ? t("dashboard") : t("home")}</Link>
        </Button>
      </StatusPage>
    </main>
  );
}
