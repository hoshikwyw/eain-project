"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setLocale } from "@/i18n/actions";

export function LocaleToggle() {
  const locale = useLocale();
  const t = useTranslations("settings");
  const [pending, startTransition] = useTransition();

  const next = locale === "en" ? "my" : "en";

  return (
    <Button
      variant="secondary"
      size="sm"
      lang={next}
      aria-label={t("language")}
      disabled={pending}
      onClick={() => startTransition(() => setLocale(next))}
    >
      {next === "my" ? t("switchToBurmese") : t("switchToEnglish")}
    </Button>
  );
}
