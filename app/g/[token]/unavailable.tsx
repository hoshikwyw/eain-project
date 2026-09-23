import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Lovebirds } from "@/components/brand/lovebirds";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

/** Shown for unknown, unpublished, regenerated or deleted links. Same page for all, on purpose. */
export async function GiftUnavailable() {
  const t = await getTranslations("gift");
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <div className="w-full max-w-xs">
        <Lovebirds />
      </div>
      <h1 className="font-display text-3xl font-semibold">{t("unavailableTitle")}</h1>
      <p className="max-w-md text-muted-foreground">{t("unavailableText")}</p>
      <Button asChild variant="soft">
        <Link href="/">{t("goHome")}</Link>
      </Button>
      <Link href="/" aria-label="Eain" className="mt-6">
        <Logo />
      </Link>
    </div>
  );
}
