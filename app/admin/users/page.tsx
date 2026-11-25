import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { AdminFlash } from "@/components/admin/flash";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/features/admin/queries";
import { listUsersAdmin } from "@/features/admin/users";
import { UserAvatar } from "@/components/ui/user-avatar";

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const me = await requireAdmin();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const t = await getTranslations("admin");
  const format = await getFormatter();
  const users = await listUsersAdmin(query);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.users")} subtitle={t("users.subtitle")} />
      <AdminFlash />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="relative w-full max-w-sm" role="search">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            type="search"
            defaultValue={query}
            placeholder={t("users.search")}
            aria-label={t("users.search")}
            className="pl-10"
          />
        </form>
        <p className="text-sm text-muted-foreground">{t("users.count", { count: users.length })}</p>
      </div>

      <ul className="flex flex-col gap-2">
        {users.map((u) => (
          <li key={u.id}>
            <Link href={`/admin/users/${u.id}`} className="block rounded-2xl">
              <Card className="transition-colors hover:bg-secondary/60">
                <CardContent className="flex items-center gap-4 p-4">
                  <UserAvatar avatar={u.avatarUrl} userId={u.id} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold">
                        {u.displayName || t("users.unnamed")}
                      </p>
                      {u.id === me.id && <Chip tone="neutral">{t("users.you")}</Chip>}
                      {u.role === "admin" && <Chip tone="primary">{t("users.roles.admin")}</Chip>}
                      {u.suspended && <Chip tone="brand">{t("users.suspended")}</Chip>}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {u.email} ·{" "}
                      {t(`users.providers.${u.provider === "google" ? "google" : "email"}`)} ·{" "}
                      {u.lastSignInAt
                        ? t("users.lastSeen", {
                            when: format.relativeTime(new Date(u.lastSignInAt)),
                          })
                        : t("users.neverSignedIn")}
                    </p>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    <Chip tone="neutral">{t("users.giftsCount", { count: u.gifts })}</Chip>
                    <Chip tone="brand">{u.points} pts</Chip>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
        {users.length === 0 && (
          <li className="py-8 text-center text-sm text-muted-foreground">{t("users.empty")}</li>
        )}
      </ul>
    </div>
  );
}
