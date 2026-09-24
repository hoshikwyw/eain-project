import { Search } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { AdminFlash } from "@/components/admin/flash";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { adjustPoints, setUserRole } from "@/features/admin/actions";
import { listUsers, requireAdmin } from "@/features/admin/queries";

const selectClass = "h-9 rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const me = await requireAdmin();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const t = await getTranslations("admin");
  const format = await getFormatter();
  const users = await listUsers(query);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.users")} subtitle={t("users.subtitle")} />
      <AdminFlash ok={typeof params.ok === "string" ? params.ok : undefined} error={typeof params.error === "string" ? params.error : undefined} />

      <form className="relative max-w-sm" role="search">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" type="search" defaultValue={query} placeholder={t("users.search")} className="pl-10" />
      </form>

      <ul className="flex flex-col gap-3">
        {users.map((u) => (
          <li key={u.id}>
            <Card>
              <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{u.display_name || t("users.unnamed")}</p>
                    <Chip tone={u.role === "admin" ? "primary" : "neutral"}>{t(`users.roles.${u.role}`)}</Chip>
                    <Chip tone="brand">{u.points_balance} pts</Chip>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {u.id} · {format.dateTime(new Date(u.created_at), { dateStyle: "medium" })} · {u.locale}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <form action={adjustPoints} className="flex items-center gap-1.5">
                    <input type="hidden" name="userId" value={u.id} />
                    <Input name="amount" type="number" required placeholder="±50" className="h-9 w-24 text-sm" />
                    <Input name="description" placeholder={t("users.reason")} maxLength={200} className="h-9 w-40 text-sm" />
                    <SubmitButton size="sm" variant="secondary">
                      {t("users.adjust")}
                    </SubmitButton>
                  </form>
                  {u.id !== me.id && (
                    <form action={setUserRole} className="flex items-center gap-1.5">
                      <input type="hidden" name="userId" value={u.id} />
                      <select name="role" defaultValue={u.role} className={selectClass} aria-label={t("users.role")}>
                        <option value="user">{t("users.roles.user")}</option>
                        <option value="admin">{t("users.roles.admin")}</option>
                      </select>
                      <SubmitButton size="sm" variant="secondary">
                        {t("users.setRole")}
                      </SubmitButton>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
        {users.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">{t("users.empty")}</li>}
      </ul>
    </div>
  );
}
