import Link from "next/link";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";
import { LocaleToggle } from "@/components/settings/locale-toggle";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="Eain" className="rounded-lg">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          <Button asChild variant="ghost" size="sm">
            <Link href="/templates">{t("templates")}</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/#how">{t("howItWorks")}</Link>
          </Button>
        </nav>

        <div className="flex items-center gap-1.5">
          <LocaleToggle />
          <ThemeToggle />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/create">{t("createGift")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
