import Link from "next/link";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";
import { LocaleToggle } from "@/components/settings/locale-toggle";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { Button } from "@/components/ui/button";

// Every link in the bar is at least 44px tall to tap, however short its words.
const navLink =
  "inline-flex min-h-11 items-center rounded-lg text-sm text-muted-foreground transition-colors hover:text-foreground";

export function SiteHeader() {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-40 border-b glass-bar">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:h-[4.5rem]">
        <Link href="/" aria-label="Eain" className="flex min-h-11 items-center rounded-lg">
          <Logo markOnlyOnPhones />
        </Link>

        <nav className="hidden items-center gap-9 md:flex" aria-label="Main">
          <Link href="/templates" className={navLink}>
            {t("templates")}
          </Link>
          <Link href="/#how" className={navLink}>
            {t("howItWorks")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LocaleToggle />
          <ThemeToggle />
          <Link href="/auth/login" className={`${navLink} px-3 max-sm:hidden`}>
            {t("login")}
          </Link>
          <Button asChild variant="ink" size="sm" className="px-5">
            <Link href="/templates">{t("createGift")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
