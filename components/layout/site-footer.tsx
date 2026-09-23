import Link from "next/link";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";

const links = [
  { key: "privacy", href: "/privacy" },
  { key: "terms", href: "/terms" },
  { key: "security", href: "/security" },
  { key: "cookies", href: "/cookies" },
  { key: "report", href: "/report" },
  { key: "contact", href: "/contact" },
] as const;

export function SiteFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="text-sm text-muted-foreground">{t("promise")}</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="text-muted-foreground hover:text-foreground"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
