import Link from "next/link";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";

const links = [
  { key: "privacy", href: "/privacy" },
  { key: "terms", href: "/terms" },
  { key: "security", href: "/security" },
  { key: "cookies", href: "/cookies" },
  // Reporting happens from each gift page; the contact page explains how.
  { key: "report", href: "/contact" },
  { key: "contact", href: "/contact" },
] as const;

export function SiteFooter() {
  const t = useTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-5 font-display text-lg font-light text-muted-foreground italic my:not-italic">
              {t("footer.promise")}
            </p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-14 gap-y-3 text-sm sm:grid-cols-3">
            {links.map((link) => (
              <Link key={link.key} href={link.href} className="text-muted-foreground transition-colors hover:text-foreground">
                {t(`footer.${link.key}`)}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-14 flex flex-col gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>
            © {year} Eain. {t("home.rights")}
          </span>
          <span>{t("brand.tagline")}</span>
        </div>
      </div>
    </footer>
  );
}
