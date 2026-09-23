import Link from "next/link";
import { useTranslations } from "next-intl";
import { Lovebirds } from "@/components/brand/lovebirds";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <div className="w-full max-w-xs">
        <Lovebirds />
      </div>
      <h1 className="font-display text-3xl font-semibold">{t("title")}</h1>
      <p className="max-w-md text-muted-foreground">{t("text")}</p>
      <Button asChild>
        <Link href="/">{t("home")}</Link>
      </Button>
    </main>
  );
}
