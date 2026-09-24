"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Bird } from "@/components/brand/lovebirds";
import { Button } from "@/components/ui/button";

/** Route-level error boundary. Shown inside the root layout, so theme and language still apply. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errorPage");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <div className="w-full max-w-48">
        <Bird variant="pink" />
      </div>
      <h1 className="font-display text-3xl font-semibold">{t("title")}</h1>
      <p className="max-w-md text-muted-foreground">{t("text")}</p>
      <div className="flex gap-2">
        <Button onClick={reset}>{t("retry")}</Button>
        <Button asChild variant="secondary">
          <Link href="/">{t("home")}</Link>
        </Button>
      </div>
      {error.digest && <p className="text-xs text-muted-foreground">{t("reference", { id: error.digest })}</p>}
    </main>
  );
}
