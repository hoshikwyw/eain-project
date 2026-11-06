"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";

/** Route-level error boundary. Shown inside the root layout, so theme and language still apply. */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorPage");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col">
      <StatusPage
        bird="pink"
        title={t("title")}
        text={t("text")}
        note={error.digest ? t("reference", { id: error.digest }) : undefined}
      >
        <Button onClick={reset}>{t("retry")}</Button>
        <Button asChild variant="secondary">
          <Link href="/">{t("home")}</Link>
        </Button>
      </StatusPage>
    </main>
  );
}
