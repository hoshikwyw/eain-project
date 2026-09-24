import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { AdminNav } from "@/components/admin/admin-nav";
import { LocaleToggle } from "@/components/settings/locale-toggle";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { requireAdmin } from "@/features/admin/queries";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  const t = await getTranslations("admin");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" aria-label="Eain">
              <Logo />
            </Link>
            <Chip tone="primary">{t("badge")}</Chip>
          </div>
          <div className="flex items-center gap-1.5">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">{t("backToDashboard")}</Link>
            </Button>
            <LocaleToggle />
            <ThemeToggle />
          </div>
        </div>
        <div className="mx-auto w-full max-w-6xl px-4">
          <AdminNav />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
