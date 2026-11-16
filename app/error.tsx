"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";
import {
  isStaleActionError,
  reloadIfStale,
  sessionStorageOrNull,
  staleReloadAllowed,
} from "@/lib/stale-page";

/**
 * Route-level error boundary. Shown inside the root layout, so theme and
 * language still apply. A stale-deploy error reloads the page instead.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorPage");
  // A page from before the last deploy called a server action the new
  // deploy does not know. A reload fixes it; this happens on the client
  // only, so reading session storage while rendering is safe.
  const storage = isStaleActionError(error) ? sessionStorageOrNull() : null;
  const refreshing = Boolean(storage && staleReloadAllowed(storage));

  useEffect(() => {
    if (!reloadIfStale(error)) console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col">
      <StatusPage
        bird="pink"
        title={refreshing ? t("refreshingTitle") : t("title")}
        text={refreshing ? t("refreshingText") : t("text")}
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
