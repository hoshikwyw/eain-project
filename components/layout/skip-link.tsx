import { useTranslations } from "next-intl";

/** Keyboard users jump past the header. Visible only when focused. */
export function SkipLink() {
  const t = useTranslations("common");
  return (
    <a
      href="#main"
      className="sr-only rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
    >
      {t("skipToContent")}
    </a>
  );
}
