import { ExternalLink, LogOut } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { AdminNav } from "@/components/admin/admin-nav";
import { LocaleToggle } from "@/components/settings/locale-toggle";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/features/admin/queries";
import { signOut } from "@/features/auth/actions";
import { userHref } from "@/lib/app-mode";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const me = await requireAdmin();
  const t = await getTranslations("admin");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" aria-label="Eain admin">
              <Logo />
            </Link>
            <Chip tone="primary">{t("badge")}</Chip>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="hidden text-sm text-muted-foreground md:inline">{me.display_name}</span>
            <Button asChild variant="ghost" size="sm">
              {/* Plain anchor: the user site may be a different origin. */}
              <a href={userHref("/dashboard")}>
                <ExternalLink />
                <span className="hidden sm:inline">{t("userSite")}</span>
              </a>
            </Button>
            <LocaleToggle />
            <ThemeToggle />
            <form action={signOut}>
              <SubmitButton variant="ghost" size="icon" aria-label={t("signOut")}>
                <LogOut />
              </SubmitButton>
            </form>
          </div>
        </div>
        <div className="mx-auto w-full max-w-6xl px-4">
          <AdminNav />
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
